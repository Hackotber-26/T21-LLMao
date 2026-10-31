'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Plus, Compass, User, Menu, X, Bot, LogIn, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUser(data.user);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      // Supabase not configured or offline
    }
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { label: 'Discover', href: '/', icon: Compass },
    { label: 'AI Matcher', href: '/assistant', icon: Bot },
    { 
      label: currentUser ? 'My Profile' : 'Demo Profile', 
      href: currentUser?.user_metadata?.username ? `/profile/${currentUser.user_metadata.username}` : '/profile/alex_dev', 
      icon: User 
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0A0D14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Wordmark - Text Only */}
        <div className="flex items-center gap-8">
          <Link href="/" className="inline-flex items-center group">
            <span className="text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors">
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

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 font-medium">
                {currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          <Link
            href="/report"
            className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium ml-1"
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

          <div className="pt-3 border-t border-white/[0.08] space-y-2">
            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout ({currentUser.email?.split('@')[0]})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium text-slate-300 hover:bg-white/[0.06] border border-white/[0.1]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2 rounded-md text-xs font-medium text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                >
                  Register
                </Link>
              </div>
            )}

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
