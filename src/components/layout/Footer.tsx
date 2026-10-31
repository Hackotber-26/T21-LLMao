'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#0A0D14]/90 backdrop-blur-md py-10 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center p-[1px]">
              <div className="w-full h-full bg-[#0D111A] rounded flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              </div>
            </div>
            <span className="text-base font-semibold text-white tracking-tight">Solvyn</span>
            <span className="text-xs text-slate-400 border-l border-slate-700 pl-2.5 ml-1">
              AI-Powered Real-World Problem Discovery &amp; Solution Engine
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Discover
            </Link>
            <Link href="/report" className="hover:text-white transition-colors">
              Report Problem
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

        <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Solvyn Platform. Built for Hacktober 2026.</p>
          <p className="flex items-center gap-1.5">
            Preserving individual human voice while generating actionable problem clusters
          </p>
        </div>
      </div>
    </footer>
  );
}
