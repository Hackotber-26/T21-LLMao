'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Plus, Compass, User, Menu, X, Bot } from 'lucide-react';

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-14 w-full border-b border-white/[0.08] bg-[#0A0D14]" />}>
      <NavbarContent />
    </Suspense>
  );
}

function NavbarContent() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Discover', href: '/', icon: Compass },
    { label: 'AI Matcher', href: '/assistant', icon: Bot },
    { label: 'My Profile', href: '/profile/alex_dev', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0A0D14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 rounded bg-rose-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              Solvyn
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/report"
            className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Problem</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0A0D14]/98 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Problem</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
