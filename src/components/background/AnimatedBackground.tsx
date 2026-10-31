'use client';

import React, { useEffect, useRef, useState } from 'react';

// Spline control points calibrated directly from the user's Figma reference
const REFERENCE_POINTS = [
  { x: 0.0, y: 0.035 },
  { x: 0.05, y: 0.075 },
  { x: 0.1, y: 0.121 },
  { x: 0.2, y: 0.361 },
  { x: 0.3, y: 0.41 },
  { x: 0.4, y: 0.444 },
  { x: 0.5, y: 0.486 },
  { x: 0.6, y: 0.503 },
  { x: 0.7, y: 0.547 },
  { x: 0.8, y: 0.584 },
  { x: 0.9, y: 0.665 },
  { x: 1.0, y: 0.75 },
];

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    let startTime = performance.now();

    // Try WebGL first for full GPU floating-point gradient smoothness
    const gl =
      canvas.getContext('webgl', {
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (gl) {
      // -------------------------------------------------------------
      // 1. High-Performance WebGL Shading Pipeline
      // -------------------------------------------------------------
      const vsSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform vec2 u_points[12];

        // Catmull-Rom spline evaluator across normalized coordinates
        float evalSpline(float x) {
          x = clamp(x, 0.0, 1.0);
          for (int i = 0; i < 11; i++) {
            if (x >= u_points[i].x && x <= u_points[i+1].x) {
              vec2 p0 = (i > 0) ? u_points[i-1] : u_points[0];
              vec2 p1 = u_points[i];
              vec2 p2 = u_points[i+1];
              vec2 p3 = (i + 2 < 12) ? u_points[i+2] : u_points[11];

              float span = max(0.0001, p2.x - p1.x);
              float t = (x - p1.x) / span;
              float t2 = t * t;
              float t3 = t2 * t;

              float m1 = 0.5 * (p2.y - p0.y);
              float m2 = 0.5 * (p3.y - p1.y);

              return (2.0*t3 - 3.0*t2 + 1.0)*p1.y + (t3 - 2.0*t2 + t)*m1 + (-2.0*t3 + 3.0*t2)*p2.y + (t3 - t2)*m2;
            }
          }
          return u_points[0].y;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          // Invert Y so 0.0 is top, 1.0 is bottom
          uv.y = 1.0 - uv.y;

          // 1. Ribs geometry (~16px pitch across screen width)
          float numRibs = max(24.0, floor(u_resolution.x / 16.0));
          float ribCoord = fract(uv.x * numRibs);

          // 2. Optical cylindrical refraction
          float localX = ribCoord - 0.5;
          float normalZ = sqrt(max(0.0, 1.0 - localX * localX * 4.0));
          float refractY = -localX * 0.016 * normalZ;

          // 3. Continuous smooth wave height
          float waveY = evalSpline(uv.x) + refractY;
          float dist = abs(uv.y - waveY);

          // 4. Reference calibrated color palettes (Figma pixel extracts)
          vec3 colCore = vec3(1.0, 0.725, 0.792);     // [255, 185, 202] Luminous core
          vec3 colPink = vec3(0.980, 0.475, 0.561);    // [250, 121, 143] Radiant pink
          vec3 colRuby = vec3(0.922, 0.282, 0.396);    // [235, 72, 101] Hot ruby
          vec3 colCrimson = vec3(0.651, 0.125, 0.231); // [166, 32, 59] Deep crimson
          vec3 colPlum = vec3(0.286, 0.094, 0.180);    // [73, 24, 46] Plum aura
          vec3 colBg = vec3(0.071, 0.102, 0.153);      // [18, 26, 39] Deep obsidian navy

          // 5. Exponential Gaussian smooth falloff
          float wCore = exp(-pow(dist / 0.040, 2.0));
          float wPink = exp(-pow(dist / 0.085, 2.0));
          float wRuby = exp(-pow(dist / 0.145, 2.0));
          float wCrimson = exp(-pow(dist / 0.210, 2.0));
          float wPlum = exp(-pow(dist / 0.290, 2.0));

          // Multi-layer smooth blend
          vec3 color = colBg;
          color = mix(color, colPlum, wPlum);
          color = mix(color, colCrimson, wCrimson);
          color = mix(color, colRuby, wRuby);
          color = mix(color, colPink, wPink);
          color = mix(color, colCore, wCore);

          // 6. Cylindrical glass flute reflections & seams
          // Subtle seam groove: exact 18-20% dip matching Figma
          float seamShadow = 1.0 - 0.20 * pow(sin(ribCoord * 3.14159265), 16.0);
          
          // Specular highlight ridge on left-third (~0.28) of convex flute
          float ridge = max(0.0, 1.0 - abs(ribCoord - 0.28) * 5.0);
          float specular = pow(ridge, 2.5) * 0.14 * (0.3 + 0.7 * wRuby);

          color = color * seamShadow + vec3(specular);

          // Subtle frame vignette fade at top and bottom
          float frameVignette = smoothstep(0.0, 0.03, uv.y) * smoothstep(1.0, 0.97, uv.y);
          color = color * frameVignette;

          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      // Full-screen quad
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1,
        ]),
        gl.STATIC_DRAW
      );

      const posAttr = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posAttr);
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

      const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
      const uPointsLoc = gl.getUniformLocation(program, 'u_points');

      const handleResize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        gl.viewport(0, 0, canvas.width, canvas.height);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      // Points buffer array for WebGL uniform (12 x 2)
      const pointsArray = new Float32Array(24);

      const renderGL = (currentTime: number) => {
        const elapsed = (currentTime - startTime) / 1000;
        const period = 14.8;
        const phase = reducedMotion ? 0 : ((elapsed % period) / period) * Math.PI * 2;

        const leftLift = Math.sin(phase) * 0.055;
        const midLift = Math.sin(phase - 0.7) * 0.04;
        const rightLift = Math.sin(phase - 1.4) * 0.065;

        // Dynamic undulation points
        for (let i = 0; i < REFERENCE_POINTS.length; i++) {
          const pt = REFERENCE_POINTS[i];
          let yOffset = 0;
          if (pt.x < 0.25) {
            yOffset = leftLift * (1 - pt.x / 0.25);
          } else if (pt.x < 0.75) {
            yOffset = midLift;
          } else {
            yOffset = rightLift * ((pt.x - 0.75) / 0.25);
          }

          pointsArray[i * 2] = pt.x;
          pointsArray[i * 2 + 1] = Math.max(0.01, Math.min(0.98, pt.y + yOffset));
        }

        gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
        gl.uniform2fv(uPointsLoc, pointsArray);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!reducedMotion) {
          animationFrameId = requestAnimationFrame(renderGL);
        }
      };

      animationFrameId = requestAnimationFrame(renderGL);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        gl.deleteProgram(program);
      };
    }

    // -------------------------------------------------------------
    // 2. High-Quality 2D Canvas Fallback (if WebGL is unavailable)
    // -------------------------------------------------------------
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize2D = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize2D();
    window.addEventListener('resize', handleResize2D);

    const render2D = (currentTime: number) => {
      if (width === 0 || height === 0) return;

      const elapsed = (currentTime - startTime) / 1000;
      const period = 14.8;
      const phase = reducedMotion ? 0 : ((elapsed % period) / period) * Math.PI * 2;
      const leftLift = Math.sin(phase) * 0.055;
      const midLift = Math.sin(phase - 0.7) * 0.04;
      const rightLift = Math.sin(phase - 1.4) * 0.065;

      ctx.fillStyle = '#0B0F18';
      ctx.fillRect(0, 0, width, height);

      // Continuous smooth ribbon
      ctx.save();
      ctx.filter = 'blur(60px)';
      ctx.lineWidth = height * 0.26;
      ctx.strokeStyle = '#EE3F6A';
      ctx.beginPath();
      ctx.moveTo(0, (REFERENCE_POINTS[0].y + leftLift) * height);
      for (let i = 1; i < REFERENCE_POINTS.length; i++) {
        const pt = REFERENCE_POINTS[i];
        let yOffset = pt.x < 0.25 ? leftLift : pt.x < 0.75 ? midLift : rightLift;
        ctx.lineTo(pt.x * width, (pt.y + yOffset) * height);
      }
      ctx.stroke();

      // Core white-pink highlight line
      ctx.filter = 'blur(16px)';
      ctx.lineWidth = height * 0.08;
      ctx.strokeStyle = '#FFC4CE';
      ctx.stroke();
      ctx.restore();

      // Rib overlay
      const ribCount = Math.max(30, Math.floor(width / 16));
      const ribW = width / ribCount;
      for (let r = 0; r < ribCount; r++) {
        const rx = r * ribW;
        const grad = ctx.createLinearGradient(rx, 0, rx + ribW, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0.22)');
        grad.addColorStop(0.28, 'rgba(255,255,255,0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0.22)');
        ctx.fillStyle = grad;
        ctx.fillRect(rx, 0, ribW, height);
      }

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(render2D);
      }
    };

    animationFrameId = requestAnimationFrame(render2D);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize2D);
    };
  }, [reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0A0D14] select-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
