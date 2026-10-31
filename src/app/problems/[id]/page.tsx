'use client';

import React, { use, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ProblemDetailResponse } from '@/types/api.types';
import { SolutionList } from '@/components/solutions/SolutionList';

interface ProblemPageProps {
  params: Promise<{ id: string }>;
}

function ProblemDetailView({ id }: { id: string }) {
  const [problem, setProblem] = useState<ProblemDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProblem() {
      try {
        const res = await fetch(`/api/problems/${id}`);
        if (!res.ok) {
          throw new Error(`Problem not found (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error?.message || 'Failed to load problem');
        }
        if (isMounted) {
          setProblem(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load problem details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProblem();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
          <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            <div className="h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center">
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">
          Problem Not Found
        </h2>
        <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
          {error || 'Unable to locate the specified problem details.'}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:opacity-90 transition"
        >
          Return to All Problems
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Problem Header Section */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-2">
            {problem.category && (
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {problem.category}
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                problem.status === 'solved'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
              }`}
            >
              {problem.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <Link
            href={`/problems/${id}/submit`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Propose a Solution
          </Link>
        </div>

        <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {problem.title}
        </h1>

        <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-line">
          {problem.description}
        </p>

        {/* Sub-problems summary tags if present */}
        {problem.sub_problems && problem.sub_problems.length > 0 && (
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Identified Root Causes:
            </span>
            {problem.sub_problems.map((sub) => (
              <span
                key={sub.name}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300"
              >
                <span>{sub.name}</span>
                <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                  {sub.count}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Integrated Community Solutions Section */}
      <section>
        <SolutionList
          solutions={problem.solutions}
          problemId={id}
          problemTitle={problem.title}
        />
      </section>
    </div>
  );
}

function PageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProblemDetailView id={id} />;
}

export default function ProblemDetailPage({ params }: ProblemPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Problem Discovery
        </Link>
      </div>

      <main className="max-w-5xl mx-auto">
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
