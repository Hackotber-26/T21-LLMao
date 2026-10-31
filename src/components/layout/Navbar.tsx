'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, PlusCircle, Compass, User, Menu, X } from 'lucide-react';

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 w-full border-b border-white/[0.08] bg-[#0A0D14]/80" />}>
      <NavbarContent />
    </Suspense>
  );
}

function NavbarContent() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Discover Problems', href: '/', icon: Compass },
    { label: 'Report a Problem', href: '/report', icon: PlusCircle },
    { label: 'My Profile', href: '/profile/alex_dev', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0A0D14]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 p-[1px] shadow-sm shadow-rose-500/25 group-hover:shadow-rose-500/40 transition-shadow">
            <div className="w-full h-full bg-[#0D111A] rounded-[7px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Solvyn
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block animate-pulse" />
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/report"
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-4 h-4" />
            Report Problem
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0A0D14]/95 backdrop-blur-2xl px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary-glow flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white"
            >
              <PlusCircle className="w-4 h-4" />
              Report Problem
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
