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
  ArrowRight,
  GitBranch,
  Terminal,
  Layers,
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
      {/* Hero Section — Asymmetric, Content-First Layout */}
      <section className="relative pt-8 pb-12 md:pt-14 md:pb-16 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Clear Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              {/* Restrained kicker badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-rose-500/25 bg-rose-950/20 text-rose-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Problem Discovery &amp; Solution Engine</span>
              </div>

              {/* Solid, confident typography — no gradient cliches */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
                Where Real-World Friction Meets Dedicated Builders
              </h1>

              {/* Focused paragraph with balanced measure */}
              <p className="text-base text-slate-300 max-w-xl leading-relaxed font-normal">
                Solvyn captures everyday citizen friction in natural language. Our engine clusters
                fragmented complaints, decomposes them into root sub-problems, and connects them with
                engineers building verified open solutions.
              </p>

              {/* Integrated Search Input */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search problems, keywords, systems (e.g. 'BMTC', 'OPD queue', 'waste')..."
                    className="w-full pl-10 pr-24 py-2.5 rounded-lg border border-white/[0.12] bg-[#0C1018]/90 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-rose-500/80 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/report" className="btn-primary">
                  <PlusCircle className="w-4 h-4" />
                  <span>Report a Problem</span>
                </Link>
                <Link href="/assistant" className="btn-secondary">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>AI Problem Matcher</span>
                </Link>
                <a
                  href="#problem-feed"
                  className="text-xs text-slate-400 hover:text-white transition-colors ml-2 flex items-center gap-1 font-medium"
                >
                  Explore clusters below <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Right Column: Architectural Pipeline Card (Explains How Solvyn Works) */}
            <div className="lg:col-span-5">
              <div className="card-structured p-5 relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Solvyn Pipeline
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    Live Workflow
                  </span>
                </div>

                {/* Pipeline Steps */}
                <div className="space-y-3 font-sans">
                  {/* Step 1: Citizen Report */}
                  <div className="p-3 rounded-lg bg-black/40 border border-white/[0.05] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">1. Citizen Report</span>
                      <span className="text-slate-500">Bangalore Urban</span>
                    </div>
                    <p className="text-xs text-slate-200 italic">
                      &ldquo;The BMTC app shows buses that never arrive. Commuters wait 45+ minutes with zero reliable status.&rdquo;
                    </p>
                  </div>

                  {/* Step 2: AI Clustering & Decomposition */}
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rose-300 font-medium flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-rose-400" />
                        2. AI Problem Decomposition
                      </span>
                      <span className="text-rose-400/80 font-mono text-[10px]">96% match</span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Transit Reliability &amp; Ghost Bus Telemetry
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <span className="px-2 py-1 rounded bg-black/30 text-slate-300 border border-white/[0.05]">
                        • Telemetry lag &gt; 180s
                      </span>
                      <span className="px-2 py-1 rounded bg-black/30 text-slate-300 border border-white/[0.05]">
                        • Sparse stop geofencing
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Verified Solutions */}
                  <div className="p-3 rounded-lg bg-black/40 border border-white/[0.05] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">3. Builder Solution</span>
                      <span className="text-rose-400 font-semibold text-[11px]">2 Solutions Built</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      OpenGTFS Realtime Telemetry Normalizer
                    </p>
                    <p className="text-[11px] text-slate-400">
                      GitHub repo with live streaming web client and ETA predictor.
                    </p>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Preserves human voice while generating engineering specs</span>
                  <Link href="/report" className="text-rose-400 hover:underline">
                    Report now →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Problem Feed Section */}
      <section id="problem-feed" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-4 mb-8">
          
          {/* Category Tabs */}
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
                      : 'bg-[#0C1018] text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sub-bar: Count and Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white">
                {loading ? 'Fetching problem statements...' : `${problems.length} Problem Clusters`}
              </span>
              {selectedCategory !== 'All' && (
                <span className="text-slate-500">in &ldquo;{selectedCategory}&rdquo;</span>
              )}
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-1 bg-[#0C1018] border border-white/[0.08] p-1 rounded-md">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedSort(opt.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
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
              <ProblemCard key={problem.id} problem={problem} solutionCount={1} />
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
              No reported friction matches your filters yet. Submit the first report and Solvyn&apos;s AI will create a new cluster.
            </p>
            <Link href="/report" className="btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              <span>Report this Problem</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
