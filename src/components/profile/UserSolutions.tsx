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
    <section aria-label="User Submitted Solutions" className={`space-y-6 ${className}`}>
      {/* Header with Title and Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Submitted Solutions
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {solutions.length}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Prototypes and implementations contributed by @{solver.username}
          </p>
        </div>

        {solutions.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="solutions-sort" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Sort by:
            </label>
            <select
              id="solutions-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOrder)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        )}
      </div>

      {/* Solutions Grid or Empty State */}
      {sortedSolutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedSolutions.map((solution) => (
            <SolutionCard
              key={solution.id}
              solution={{
                ...solution,
                solver: solver,
              }}
              showProblemContext={true}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <div
          data-testid="profile-solutions-empty"
          className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-10 sm:p-14 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 shadow-2xs">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            No solutions submitted yet
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            When @{solver.username} publishes code repositories or live prototypes solving community problems, they will appear here.
          </p>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
