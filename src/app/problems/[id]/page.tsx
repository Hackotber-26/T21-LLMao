'use client';

import React, { use, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ProblemDetailResponse } from '@/types/api.types';
import { SolutionList } from '@/components/solutions/SolutionList';

interface ProblemPageProps {
  params: Promise<{ id: string }>;
}

function ArrowLeftIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function AlertTriangleIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function Code2Icon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}

function LayersIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MessageSquareIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  );
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
          throw new Error(json.error?.message || 'Failed to load problem cluster');
        }
        if (isMounted) {
          setProblem(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load problem statement.');
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
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <svg className="w-8 h-8 text-rose-400 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-slate-400">Loading problem cluster details...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Problem Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          {error || 'The requested problem cluster statement could not be loaded.'}
        </p>
        <Link
          href="/"
          className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0C1018]/90 hover:bg-[#141C2A] text-slate-100 text-sm font-medium rounded-lg border border-white/[0.14] transition-all shadow-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(problem.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Discover
      </Link>

      {/* Main Problem Cluster Header Card */}
      <div className="card-structured rounded-xl border border-white/[0.08] bg-[#0C1018]/90 backdrop-blur-md p-6 sm:p-8 mb-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
              {problem.category}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] capitalize">
              <AlertTriangleIcon className="w-3 h-3 text-rose-400" />
              {problem.urgency || 'medium'} urgency
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-black/40 text-slate-400 border border-white/[0.06]">
              {problem.status}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Formed {formattedDate}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
          {problem.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
          {problem.description}
        </p>

        {/* Target Users */}
        {problem.target_users && problem.target_users.length > 0 && (
          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/30 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Affected Groups:</span>
            {problem.target_users.map((userGroup, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-200 border border-white/[0.08] font-medium"
              >
                {userGroup}
              </span>
            ))}
          </div>
        )}

        {/* Cluster Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-0.5">
              <UsersIcon className="w-3 h-3 text-rose-400" /> Total Reports
            </span>
            <span className="text-xl font-semibold text-white">{problem.report_count}</span>
          </div>

          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-0.5">
              <Code2Icon className="w-3 h-3 text-rose-400" /> Solutions Built
            </span>
            <span className="text-xl font-semibold text-white">
              {problem.solutions?.length || 0}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-0.5">
              <LayersIcon className="w-3 h-3 text-rose-400" /> Sub-Problems
            </span>
            <span className="text-xl font-semibold text-white">
              {problem.sub_problems?.length || 1}
            </span>
          </div>
        </div>

        {/* Actions bar */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-3">
          <Link
            href={`/problems/${id}/submit`}
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-lg border border-white/20 transition-all shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Provide a Solution</span>
          </Link>

          <Link
            href={`/report?category=${encodeURIComponent(problem.category || '')}`}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0C1018]/90 hover:bg-[#141C2A] text-slate-100 text-sm font-medium rounded-lg border border-white/[0.14] transition-all shadow-sm"
          >
            <MessageSquareIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>Report a Similar Friction</span>
          </Link>
        </div>
      </div>

      {/* Grid: Left Column = Sub-problems & Individual Reports; Right Column = Solutions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sub-Problems & Raw Community Reports */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sub-Problems Breakdown */}
          <div className="card-structured rounded-xl border border-white/[0.08] bg-[#0C1018]/90 p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <LayersIcon className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                Identified Sub-Problems
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              AI decomposes user reports into distinct technical sub-problems:
            </p>

            <div className="space-y-2">
              {problem.sub_problems && problem.sub_problems.length > 0 ? (
                problem.sub_problems.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-white/[0.06] bg-black/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-slate-200">{sub.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 font-mono text-[10px] shrink-0 border border-rose-800/40">
                      {sub.count} {sub.count === 1 ? 'rep' : 'reps'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 rounded-lg border border-white/[0.06] bg-black/30 text-xs text-slate-400">
                  No sub-problems categorized yet.
                </div>
              )}
            </div>
          </div>

          {/* Sample Community Reports */}
          {problem.sample_reports && problem.sample_reports.length > 0 && (
            <div className="card-structured rounded-xl border border-white/[0.08] bg-[#0C1018]/90 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquareIcon className="w-4 h-4 text-rose-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Individual Reports
                  </h2>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Preserved</span>
              </div>

              <div className="space-y-2.5">
                {problem.sample_reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-lg border border-white/[0.05] bg-black/40 text-xs space-y-1.5"
                  >
                    <p className="text-slate-300 italic leading-relaxed">
                      &ldquo;{rep.original_text}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                      <span className="text-rose-300 font-medium">{rep.sub_problem}</span>
                      <span>
                        {new Date(rep.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Submitted Solutions via reusable SolutionList */}
        <div className="lg:col-span-2 space-y-5">
          <SolutionList
            solutions={problem.solutions}
            problemId={id}
            problemTitle={problem.title}
          />
        </div>
      </div>
    </div>
  );
}

function PageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProblemDetailView id={id} />;
}

export default function ProblemDetailPage({ params }: ProblemPageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <svg className="w-8 h-8 text-rose-400 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-slate-400">Loading problem cluster details...</p>
        </div>
      }
    >
      <PageContent params={params} />
    </Suspense>
  );
}
