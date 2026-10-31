'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
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

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let startTime = performance.now();

    // S-curve base reference control points (normalized coordinates: 0.0 to 1.0)
    // Directly calibrated from the Figma reference PNG:
    const baseCurve = [
      { x: 0.0, y: 0.06 },
      { x: 0.1, y: 0.22 },
      { x: 0.2, y: 0.38 },
      { x: 0.35, y: 0.49 },
      { x: 0.5, y: 0.58 },
      { x: 0.65, y: 0.64 },
      { x: 0.8, y: 0.66 },
      { x: 0.95, y: 0.74 },
      { x: 1.0, y: 0.78 },
    ];

    // Resize handler maintaining high-DPI clarity
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Compute cubic spline through points
    const getSplineY = (xNorm: number, points: { x: number; y: number }[]) => {
      if (xNorm <= points[0].x) return points[0].y;
      if (xNorm >= points[points.length - 1].x)
        return points[points.length - 1].y;

      let i = 0;
      while (i < points.length - 1 && points[i + 1].x < xNorm) {
        i++;
      }

      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[Math.min(points.length - 1, i + 1)];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const t = (xNorm - p1.x) / (p2.x - p1.x);
      const t2 = t * t;
      const t3 = t2 * t;

      // Catmull-Rom spline interpolation
      const v0 = (p2.y - p0.y) * 0.5;
      const v1 = (p3.y - p1.y) * 0.5;

      return (
        (2 * t3 - 3 * t2 + 1) * p1.y +
        (t3 - 2 * t2 + t) * v0 +
        (-2 * t3 + 3 * t2) * p2.y +
        (t3 - t2) * v1
      );
    };

    // Render a single frame
    const render = (currentTime: number) => {
      if (width === 0 || height === 0) return;

      // Cycle period calibrated from video recording: ~14.8 seconds
      const elapsed = (currentTime - startTime) / 1000;
      const period = 14.8;
      const progress = reducedMotion ? 0 : (elapsed % period) / period;
      const phase = progress * Math.PI * 2;

      // Harmonic vertical oscillation matching the video optical flow:
      // Left crest rises in first half, dips in second half
      // Wave shape undulates smoothly
      const leftShift = Math.sin(phase) * 0.07;
      const midShift = Math.sin(phase - 0.6) * 0.05;
      const rightShift = Math.sin(phase - 1.2) * 0.09;

      const dynamicPoints = baseCurve.map((pt) => {
        let yOffset = 0;
        if (pt.x < 0.3) {
          yOffset = leftShift * (1 - pt.x / 0.3);
        } else if (pt.x < 0.7) {
          yOffset = midShift;
        } else {
          yOffset = rightShift * ((pt.x - 0.7) / 0.3);
        }
        return {
          x: pt.x,
          y: Math.max(0.02, Math.min(0.96, pt.y + yOffset)),
        };
      });

      // 1. Dark obsidian canvas base (#0A0D14 with very subtle slate vignette)
      ctx.fillStyle = '#0A0D14';
      ctx.fillRect(0, 0, width, height);

      // Radial subtle ambient depth
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(16, 22, 34, 0.4)');
      bgGrad.addColorStop(1, 'rgba(8, 11, 18, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Rib parameters (stationary glass sheet)
      // Exactly ~52 ribs on desktop (approx 18px pitch at 930px reference width)
      const targetRibCount = Math.max(30, Math.min(75, Math.round(width / 18)));
      const ribWidth = width / targetRibCount;

      // 3. Render each vertical glass rib with cylindrical optical lens refraction
      for (let r = 0; r < targetRibCount; r++) {
        const rx = r * ribWidth;
        const centerX = rx + ribWidth * 0.5;
        const normX = centerX / width;

        // Wave center Y for this specific rib
        const cyNorm = getSplineY(normX, dynamicPoints);
        const cy = cyNorm * height;

        // Draw the glowing beam segment through this rib
        // Vertical gradient with exact Figma reference color stops
        const span = height * 0.38; // Vertical span of the beam
        const topY = cy - span;
        const bottomY = cy + span;

        const ribGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
        ribGrad.addColorStop(0.0, 'rgba(14, 18, 28, 0)');
        ribGrad.addColorStop(0.2, 'rgba(58, 37, 54, 0.25)'); // Aura plum
        ribGrad.addColorStop(0.35, 'rgba(138, 47, 78, 0.65)'); // Deep crimson
        ribGrad.addColorStop(0.44, 'rgba(238, 63, 106, 0.92)'); // Radiant ruby
        ribGrad.addColorStop(0.49, 'rgba(255, 117, 150, 0.98)'); // Hot pink
        ribGrad.addColorStop(0.5, 'rgba(255, 202, 211, 1.0)'); // Specular peach-white core
        ribGrad.addColorStop(0.51, 'rgba(255, 117, 150, 0.98)');
        ribGrad.addColorStop(0.56, 'rgba(238, 63, 106, 0.92)');
        ribGrad.addColorStop(0.65, 'rgba(138, 47, 78, 0.65)');
        ribGrad.addColorStop(0.8, 'rgba(58, 37, 54, 0.25)');
        ribGrad.addColorStop(1.0, 'rgba(14, 18, 28, 0)');

        ctx.fillStyle = ribGrad;
        ctx.fillRect(rx, 0, ribWidth, height);

        // 4. Cylindrical Lens Overlay for each rib:
        // Highlights convex ridge, darkens vertical seams
        const lensGrad = ctx.createLinearGradient(rx, 0, rx + ribWidth, 0);
        lensGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.7)'); // Left seam groove
        lensGrad.addColorStop(0.08, 'rgba(0, 0, 0, 0.4)');
        lensGrad.addColorStop(0.26, 'rgba(255, 255, 255, 0.09)'); // Specular highlight ridge
        lensGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
        lensGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.2)');
        lensGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.7)'); // Right seam groove

        ctx.fillStyle = lensGrad;
        ctx.fillRect(rx, 0, ribWidth, height);
      }

      // 5. Subtle fine horizontal seam lines between glass ribs
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let r = 0; r <= targetRibCount; r++) {
        const rx = Math.floor(r * ribWidth) + 0.5;
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx, height);
      }
      ctx.stroke();

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0A0D14] select-none"
    >
      {/* High-DPI Canvas Rendering reference-accurate animated ribbed glass */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Subtle fine tactile noise overlay for realistic physical glass texture */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
