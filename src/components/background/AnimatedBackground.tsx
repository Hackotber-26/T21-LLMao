'use client';

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05070D] select-none"
    >
      {/* 1. Base ambient atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,41,59,0.35),rgba(5,7,13,0.95))]" />

      {/* 2. Narrow Gradient Band with Flow Animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="animate-ribbon relative w-[140vw] h-[160px] md:h-[220px] lg:h-[260px] -rotate-[18deg] opacity-80"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.3) 15%, rgba(99,102,241,0.95) 40%, rgba(168,85,247,0.95) 60%, rgba(6,182,212,0.85) 85%, transparent 100%)',
            boxShadow:
              '0 0 100px 30px rgba(99,102,241,0.45), 0 0 180px 70px rgba(6,182,212,0.3)',
          }}
        >
          {/* Internal luminous core for optical depth */}
          <div
            className="absolute inset-x-[15%] top-1/2 -translate-y-1/2 h-[40px] md:h-[60px] rounded-full opacity-90 blur-xl"
            style={{
              background:
                'linear-gradient(90deg, rgba(56,189,248,0.9) 0%, rgba(255,255,255,0.95) 45%, rgba(192,132,252,0.95) 80%, rgba(6,182,212,0.8) 100%)',
            }}
          />
        </div>
      </div>

      {/* 3. Ribbed-Glass (Fluted / Reeded Glass) Overlay */}
      <div className="ribbed-glass-overlay absolute inset-0" />

      {/* 4. Fine Tactile Grain Noise Overlay for realism and depth */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 5. Subtle Vignette to keep focus on foreground content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(5,7,13,0.7)_100%)]" />
    </div>
  );
}
