'use client';

import React, { use, Suspense } from 'react';
import Link from 'next/link';
import { SolutionForm } from '@/components/solutions/SolutionForm';

interface SubmitPageProps {
  params: Promise<{ id: string }>;
}

function SubmitContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SolutionForm problemId={id} />;
}

export default function SubmitSolutionPage({ params }: SubmitPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8">
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
            <div className="w-full max-w-3xl mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm animate-pulse">
              <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-4" />
              <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-800/60 rounded-md mb-8" />
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-xl mb-6" />
              <div className="h-28 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-xl mb-6" />
            </div>
          }
        >
          <SubmitContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}
