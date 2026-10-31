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
      <div className={`space-y-4 ${className}`} aria-label="Loading solutions">
        <div className="flex items-center justify-between pb-2">
          <div className="h-5 w-40 bg-white/[0.06] rounded-md animate-pulse" />
          <div className="h-7 w-24 bg-white/[0.06] rounded-md animate-pulse" />
        </div>
        <div className="space-y-3.5">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="card-structured rounded-xl border border-white/[0.08] bg-[#0C1018]/90 p-5 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/[0.06]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-36 bg-white/[0.06] rounded-sm" />
                  <div className="h-3 w-48 bg-white/[0.04] rounded-sm" />
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-3 w-full bg-white/[0.04] rounded-sm" />
                <div className="h-3 w-5/6 bg-white/[0.04] rounded-sm" />
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
        className={`card-structured rounded-xl border border-rose-800/40 bg-rose-950/20 p-6 text-center ${className}`}
        role="alert"
      >
        <h3 className="text-sm font-semibold text-rose-300">
          Failed to load solutions
        </h3>
        <p className="mt-1 text-xs text-rose-400/80">
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
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-xs font-medium text-white transition-colors"
          >
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
        className={`card-structured rounded-xl border border-dashed border-white/[0.1] bg-[#0C1018]/60 p-8 text-center space-y-2 ${className}`}
      >
        <svg className="w-7 h-7 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </svg>
        <h3 className="text-sm font-semibold text-white">No solutions submitted yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {problemTitle
            ? `Be the first engineer or team to propose an open-source solution or prototype for "${problemTitle}".`
            : 'Be the first engineer or team to propose an open-source solution or prototype for this cluster.'}
        </p>
        {problemId && (
          <div className="pt-2">
            <Link
              href={`/problems/${problemId}/submit`}
              className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold rounded-lg border border-white/20 transition-all shadow-sm"
            >
              Submit the First Solution
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Active Grid of Solutions
  return (
    <section className={`space-y-4 ${className}`} aria-label="Solutions">
      {/* List Header with Count & Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
            <span>Submitted Solutions ({solutions.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Working codebases and live implementations built for this cluster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Controls */}
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#080B12] p-1 text-xs">
            <button
              type="button"
              onClick={() => setSortBy('most_liked')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                sortBy === 'most_liked'
                  ? 'bg-rose-950/60 border border-rose-800/40 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Upvoted
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                sortBy === 'newest'
                  ? 'bg-rose-950/60 border border-rose-800/40 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortBy('oldest')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                sortBy === 'oldest'
                  ? 'bg-rose-950/60 border border-rose-800/40 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Oldest
            </button>
          </div>

          {problemId && (
            <Link
              href={`/problems/${problemId}/submit`}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0"
            >
              + Add Solution
            </Link>
          )}
        </div>
      </div>

      {/* Stack of Cards */}
      <div className="space-y-3.5">
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
