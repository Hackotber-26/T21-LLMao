'use client';

import React, { use, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { SolutionDetailResponse } from '@/types/api.types';
import { SolutionCard } from '@/components/solutions/SolutionCard';

interface SolutionDetailPageProps {
  params: Promise<{ id: string }>;
}

function SolutionDetailView({ id }: { id: string }) {
  const [solution, setSolution] = useState<SolutionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchSolution() {
      try {
        const res = await fetch(`/api/solutions/${id}`);
        if (!res.ok) {
          throw new Error(`Solution not found (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error?.message || 'Failed to load solution');
        }
        if (isMounted) {
          setSolution(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load solution details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSolution();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="h-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-8 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
      </div>
    );
  }

  if (error || !solution) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center">
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">
          Solution Not Found
        </h2>
        <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
          {error || 'Unable to load the requested solution.'}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:opacity-90 transition"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solution Presentation */}
      <SolutionCard
        solution={solution}
        showProblemContext={true}
        className="shadow-sm"
      />
    </div>
  );
}

function PageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SolutionDetailView id={id} />;
}

export default function SolutionDetailPage({ params }: SolutionDetailPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Problems
        </Link>
      </div>

      <main className="max-w-4xl mx-auto">
        <Suspense
          fallback={
            <div className="h-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 animate-pulse" />
          }
        >
          <PageContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}
