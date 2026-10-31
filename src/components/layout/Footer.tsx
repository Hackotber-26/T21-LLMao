'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#0A0D14]/90 backdrop-blur-md py-8 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-white tracking-tight">Solvyn</span>
            <span className="text-xs text-slate-400 border-l border-white/[0.1] pl-2.5 ml-1">
              AI-Powered Real-World Problem Discovery &amp; Solution Engine
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Discover
            </Link>
            <Link href="/assistant" className="hover:text-white transition-colors">
              AI Matcher
            </Link>
            <Link href="/report" className="hover:text-white transition-colors">
              Report Friction
            </Link>
            <a
              href="https://github.com/Hackotber-26/T21-LLMao"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© 2026 Solvyn Platform. Built for Hacktober 2026.</p>
          <p>
            Preserving individual human voice while generating structured engineering specifications
          </p>
        </div>
      </div>
    </footer>
  );
}
