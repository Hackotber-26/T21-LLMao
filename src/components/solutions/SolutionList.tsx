'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { SolutionCard, SolutionCardProps } from './SolutionCard';

export type SortOption = 'most_liked' | 'newest' | 'oldest';

export interface SolutionListProps {
  /** Initial array of solutions (optional) */
  solutions?: SolutionCardProps['solution'][];
  /** Problem ID to fetch solutions for dynamically if solutions array is not provided */
  problemId?: string;
  /** Problem title for empty state / submit CTA */
  problemTitle?: string;
  /** Show link to problem in each card */
  showProblemContext?: boolean;
  /** Custom class names */
  className?: string;
}

export function SolutionList({
  solutions: initialSolutions,
  problemId,
  problemTitle,
  showProblemContext = false,
  className = '',
}: SolutionListProps) {
  const [fetchedSolutions, setFetchedSolutions] = useState<
    SolutionCardProps['solution'][] | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialSolutions && !!problemId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('most_liked');

  // Derive solutions: prioritize initialSolutions if provided, else fetchedSolutions
  const solutions = initialSolutions ?? fetchedSolutions;

  useEffect(() => {
    let isMounted = true;

    async function loadSolutions() {
      if (initialSolutions || !problemId) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/problems/${problemId}`);
        if (!response.ok) {
          throw new Error(`Failed to load solutions (status ${response.status})`);
        }
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Failed to load problem solutions');
        }

        if (isMounted) {
          setFetchedSolutions(result.data.solutions || []);
        }
      } catch (err) {
        console.error('Error fetching problem solutions:', err);
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Unable to load solutions. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSolutions();

    return () => {
      isMounted = false;
    };
  }, [initialSolutions, problemId]);

  // Sort solutions client-side according to active sort option
  const sortedSolutions = useMemo(() => {
    if (!solutions) return [];

    return [...solutions].sort((a, b) => {
      if (sortBy === 'most_liked') {
        const diff = (b.like_count || 0) - (a.like_count || 0);
        if (diff !== 0) return diff;
        // Tie-breaker: newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      // 'newest'
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [solutions, sortBy]);

  // Loading State with Skeleton Cards
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`} aria-label="Loading solutions">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                  <div className="h-3 w-40 bg-zinc-100 dark:bg-zinc-800/60 rounded-sm" />
                </div>
              </div>
              <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
              <div className="space-y-2">
                <div className="h-3.5 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-sm" />
                <div className="h-3.5 w-5/6 bg-zinc-100 dark:bg-zinc-800/60 rounded-sm" />
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                <div className="h-6 w-20 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
                <div className="h-6 w-20 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (errorMessage) {
    return (
      <div
        className={`rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center ${className}`}
        role="alert"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">
          Failed to load solutions
        </h3>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
          {errorMessage}
        </p>
        {problemId && (
          <button
            type="button"
            onClick={() => {
              if (problemId) {
                setIsLoading(true);
                setErrorMessage(null);
                fetch(`/api/problems/${problemId}`)
                  .then((r) => r.json())
                  .then((res) => {
                    if (res.success && res.data) {
                      setFetchedSolutions(res.data.solutions || []);
                    } else {
                      setErrorMessage(res.error?.message || 'Failed to load');
                    }
                  })
                  .catch((e) => setErrorMessage(e.message))
                  .finally(() => setIsLoading(false));
              }
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty State
  if (!solutions || solutions.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-10 text-center ${className}`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          No solutions submitted yet
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {problemTitle
            ? `Be the first builder to propose an architecture or repository for "${problemTitle}".`
            : 'Be the first developer to propose an implementation for this challenge.'}
        </p>
        {problemId && (
          <div className="mt-6">
            <Link
              href={`/problems/${problemId}/submit`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit the First Solution
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Active Grid of Solutions
  return (
    <section className={`space-y-6 ${className}`} aria-label="Solutions">
      {/* List Header with Count & Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Community Solutions</span>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {solutions.length}
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Open-source implementations, prototypes, and architecture designs.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => setSortBy('most_liked')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              sortBy === 'most_liked'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Top Upvoted
          </button>
          <button
            type="button"
            onClick={() => setSortBy('newest')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              sortBy === 'newest'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSortBy('oldest')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              sortBy === 'oldest'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Oldest
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedSolutions.map((solution) => (
          <SolutionCard
            key={solution.id}
            solution={solution}
            showProblemContext={showProblemContext}
          />
        ))}
      </div>
    </section>
  );
}
