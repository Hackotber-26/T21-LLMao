'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Problem } from '@/types/api.types';
import ProblemCard from '@/components/problems/ProblemCard';
import {
  Search,
  PlusCircle,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  ArrowDown,
  GitBranch,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Transportation',
  'Healthcare',
  'Civic Infrastructure',
  'Agriculture & Food',
  'Education',
  'Environment',
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Latest', icon: Clock },
  { id: 'most_reported', label: 'Most Reported', icon: Users },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'unsolved', label: 'Unsolved', icon: CheckCircle2 },
];

export default function HomePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('newest');

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await api.getProblems({
        q: searchQuery,
        category: selectedCategory,
        sort: selectedSort,
      });
      setProblems(data.items);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, [selectedCategory, selectedSort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProblems();
  };

  return (
    <div className="w-full">
      {/* Hero Section — Spacious, Centered & Clean with Maximum Text Legibility */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Restrained kicker badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-[#0C1018]/90 text-rose-300 text-xs font-medium mb-6 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>AI-Driven Problem Discovery &amp; Solution Platform</span>
          </div>

          {/* Solid high-contrast headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.12] drop-shadow-md">
            Where Real-World Friction Meets Dedicated Builders
          </h1>

          {/* High-contrast, balanced paragraph */}
          <p className="text-base sm:text-lg text-slate-100 max-w-2xl mx-auto mb-9 leading-relaxed font-normal drop-shadow-sm">
            Report the everyday challenges you experience in plain language. Solvyn clusters
            fragmented grievances into structured problem statements and isolates root sub-problems so
            builders can create verified solutions.
          </p>

          {/* Action Buttons with high-contrast surfaces */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/report" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span>Report a Problem</span>
            </Link>
            <a href="#problem-feed" className="btn-secondary">
              <span>Explore Problem Feed</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
            <Link href="/assistant" className="btn-secondary">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>AI Problem Matcher</span>
            </Link>
          </div>

        </div>
      </section>

      {/* How Solvyn Operates — Spacious 3-Step Horizontal Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-b border-white/[0.06]">
        <div className="text-center max-w-md mx-auto mb-8">
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400">
            How Solvyn Operates
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-white mt-1">
            From Everyday Grievance to Verified Build
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1: Citizen Grievance */}
          <div className="card-structured p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">1. Citizen Reporting</span>
              <span className="font-mono text-[10px] text-slate-500">Natural Language</span>
            </div>
            <p className="text-xs text-slate-200 italic bg-black/40 p-3 rounded-lg border border-white/[0.04] leading-relaxed">
              &ldquo;The BMTC app shows ghost buses that never arrive. Commuters wait 45+ minutes on ORR with zero reliable status.&rdquo;
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Citizens describe raw everyday friction without needing technical vocabulary.
            </p>
          </div>

          {/* Step 2: AI Decomposition */}
          <div className="card-structured p-5 space-y-3 border-rose-500/20 bg-rose-950/15">
            <div className="flex items-center justify-between text-xs text-rose-300">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-rose-400" />
                2. AI Decomposition
              </span>
              <span className="font-mono text-[10px] text-rose-400/90">96% clustered</span>
            </div>
            <div className="space-y-1.5 pt-0.5">
              <div className="text-xs font-semibold text-white">
                Transit Reliability &amp; Ghost Bus Telemetry
              </div>
              <div className="text-[11px] text-slate-300 bg-black/30 p-2 rounded border border-white/[0.04]">
                • Telemetry lag &gt; 180s from bus transponders
              </div>
              <div className="text-[11px] text-slate-300 bg-black/30 p-2 rounded border border-white/[0.04]">
                • Sparse stop geofencing and ETA drift
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sub-problems are isolated so solutions target actual technical bottlenecks.
            </p>
          </div>

          {/* Step 3: Verified Solutions */}
          <div className="card-structured p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">3. Builder Solution</span>
              <span className="font-mono text-[10px] text-emerald-400">Open-Source</span>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-white/[0.04] space-y-1.5">
              <div className="text-xs font-semibold text-white">OpenGTFS Realtime Telemetry</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Lightweight PWA with crowd-sourced verification and ETA predictions.
              </p>
              <div className="text-[10px] text-rose-400 font-medium pt-0.5">
                GitHub Repo • Live PWA • 24 upvotes
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Developers solve verified community friction with working repositories and prototypes.
            </p>
          </div>
        </div>
      </section>

      {/* Main Problem Feed Section */}
      <section id="problem-feed" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        
        {/* Discovery Toolbar: Search, Categories & Sort Controls */}
        <div className="card-structured p-4 sm:p-5 mb-8 space-y-4">
          
          {/* Search Row */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problem clusters by keyword, agency, or system (e.g. 'BMTC', 'hospital OPD', 'waste management')..."
              className="w-full pl-10 pr-24 py-2.5 rounded-lg border border-white/[0.1] bg-[#080B12] text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-rose-500/80 transition-colors"
            />
            <button
              type="submit"
              className="btn-primary absolute right-1.5 top-1 px-3 py-1.5 text-xs"
            >
              Search
            </button>
          </form>

          {/* Categories Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-[#080B12] text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sub-bar: Count and Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">
                {loading ? 'Finding problem clusters...' : `${problems.length} Problem Clusters`}
              </span>
              {selectedCategory !== 'All' && (
                <span className="text-slate-400 ml-1.5">in &ldquo;{selectedCategory}&rdquo;</span>
              )}
            </div>

            {/* Sort toggles */}
            <div className="flex items-center gap-1 bg-[#080B12] border border-white/[0.08] p-1 rounded-md">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedSort(opt.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Problems Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="card-structured p-6 animate-pulse space-y-4"
              >
                <div className="h-4 bg-white/[0.06] rounded w-1/4" />
                <div className="h-5 bg-white/[0.08] rounded w-3/4" />
                <div className="h-12 bg-white/[0.04] rounded w-full" />
                <div className="h-4 bg-white/[0.05] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : problems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {problems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                solutionCount={(problem as any).solution_count ?? 0}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="card-structured p-10 text-center max-w-md mx-auto my-8">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3 text-rose-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No matching problem clusters</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              No reported friction matches your filters yet. Submit the first report and Solvyn&apos;s AI will initialize a cluster.
            </p>
            <Link href="/report" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span>Report this Problem</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
