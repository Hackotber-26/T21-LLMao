'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Problem } from '@/types/api.types';
import ProblemCard from '@/components/problems/ProblemCard';
import {
  Search,
  PlusCircle,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
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
  const [isPending, startTransition] = useTransition();

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
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-950/40 text-cyan-300 text-xs font-medium mb-6 shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Driven Problem Clustering Engine</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.12]">
            Where Everyday Friction Meets{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Real-World Builders
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Report challenges in natural language. Our AI organizes individual grievances into
            structured, actionable problem clusters with root sub-problems so engineers can build
            verified solutions.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative max-w-2xl mx-auto mb-8 group"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problems, keywords, or systems (e.g. 'BMTC', 'hospital OPD', 'waste')..."
                className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-white/[0.12] bg-[#0A0E1A]/85 backdrop-blur-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 shadow-xl shadow-black/40 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md shadow-cyan-500/25 transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/report"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Report a Problem
            </Link>
            <a
              href="#problem-feed"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-slate-200 border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-all backdrop-blur-sm"
            >
              Explore Existing Clusters
            </a>
          </div>
        </div>
      </section>

      {/* Main Problem Feed Section */}
      <section id="problem-feed" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sorting and Feed Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="font-semibold text-white">
                {loading ? 'Finding problem clusters...' : `${problems.length} Problem Clusters`}
              </span>
              {selectedCategory !== 'All' && (
                <span className="text-slate-500">in {selectedCategory}</span>
              )}
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-1 bg-[#0A0E1A]/80 border border-white/[0.08] p-1 rounded-lg backdrop-blur-md">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedSort(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-white/[0.1] text-cyan-300 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-white/[0.06] bg-[#0A0E1A]/40 p-6 animate-pulse space-y-4"
              >
                <div className="h-4 bg-white/[0.08] rounded w-1/4" />
                <div className="h-6 bg-white/[0.08] rounded w-3/4" />
                <div className="h-14 bg-white/[0.05] rounded w-full" />
                <div className="h-4 bg-white/[0.06] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : problems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} solutionCount={1} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B0F19]/60 backdrop-blur-md p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No problems matched your query</h3>
            <p className="text-sm text-slate-400 mb-6">
              Be the first to report this challenge so the AI can create a new problem cluster.
            </p>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/25"
            >
              <PlusCircle className="w-4 h-4" />
              Report this Problem
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
