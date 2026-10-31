'use client';

import React from 'react';

export interface ProfileStatsProps {
  solutionCount: number;
  problemCount: number;
  totalLikes?: number;
  className?: string;
}

export function ProfileStats({
  solutionCount,
  problemCount,
  totalLikes = 0,
  className = '',
}: ProfileStatsProps) {
  const stats = [
    {
      id: 'solutions',
      label: 'Solutions Submitted',
      value: solutionCount,
      description: 'Accepted & open solutions',
      icon: (
        <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      id: 'problems',
      label: 'Problems Reported',
      value: problemCount,
      description: 'Community pain points raised',
      icon: (
        <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      bgGlow: 'from-teal-500/10 to-transparent',
      borderColor: 'border-teal-100 dark:border-teal-900/40',
    },
    {
      id: 'likes',
      label: 'Upvotes Received',
      value: totalLikes,
      description: 'Appreciation from peers',
      icon: (
        <svg className="h-6 w-6 text-rose-600 dark:text-rose-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
      bgGlow: 'from-rose-500/10 to-transparent',
      borderColor: 'border-rose-100 dark:border-rose-900/40',
    },
  ];

  return (
    <section aria-label="Contribution Statistics" className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            data-testid={`profile-stat-${stat.id}`}
            className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-white dark:bg-zinc-900 p-5 shadow-xs transition hover:shadow-md`}
          >
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.bgGlow} blur-xl`} />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                  {stat.description}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60 shadow-xs">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
