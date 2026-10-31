'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Solution } from '@/types/api.types';
import { SolutionCard } from '@/components/solutions/SolutionCard';

export interface UserSolutionsProps {
  solutions: Array<
    Solution & {
      problem?: {
        id: string;
        title: string;
        category?: string | null;
        status?: string | null;
      } | null;
    }
  >;
  solver: {
    id: string;
    username: string;
    full_name?: string | null;
    avatar_url?: string | null;
  };
  className?: string;
}

type SortOrder = 'newest' | 'oldest' | 'upvotes';

export function UserSolutions({
  solutions,
  solver,
  className = '',
}: UserSolutionsProps) {
  const [sortBy, setSortBy] = useState<SortOrder>('newest');

  const sortedSolutions = useMemo(() => {
    const list = [...solutions];
    switch (sortBy) {
      case 'upvotes':
        return list.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      case 'oldest':
        return list.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case 'newest':
      default:
        return list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [solutions, sortBy]);

  return (
    <section aria-label="User Submitted Solutions" className={`space-y-3.5 ${className}`}>
      {/* Header with Title and Sorting Controls */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
          </svg>
          <span>Submitted Solutions ({solutions.length})</span>
        </h2>

        {solutions.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-white/[0.08] bg-[#080B12] text-xs">
            <label htmlFor="solutions-sort" className="sr-only">
              Sort by:
            </label>
            <select
              id="solutions-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOrder)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#0A0D14] text-slate-200">Newest First</option>
              <option value="upvotes" className="bg-[#0A0D14] text-slate-200">Most Upvoted</option>
              <option value="oldest" className="bg-[#0A0D14] text-slate-200">Oldest First</option>
            </select>
          </div>
        )}
      </div>

      {/* Solutions Grid or Empty State */}
      {sortedSolutions.length > 0 ? (
        <div className="space-y-3.5">
          {sortedSolutions.map((solution) => (
            <SolutionCard
              key={solution.id}
              solution={{
                ...solution,
                solver: solver,
              }}
              showProblemContext={true}
            />
          ))}
        </div>
      ) : (
        <div
          data-testid="profile-solutions-empty"
          className="card-structured rounded-xl border border-dashed border-white/[0.1] bg-[#0C1018]/60 p-8 text-center space-y-2"
        >
          <svg className="w-7 h-7 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
          </svg>
          <h3 className="text-sm font-semibold text-white">No solutions submitted yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When @{solver.username} publishes code repositories or live prototypes solving community problems, they will appear here.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0C1018]/90 hover:bg-[#141C2A] text-slate-100 text-xs font-medium rounded-lg border border-white/[0.14] transition-all shadow-sm"
            >
              <svg className="h-3.5 w-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Explore Open Problems</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
