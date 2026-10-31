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
      borderColor: 'border-white/[0.08]',
    },
    {
      id: 'problems',
      label: 'Problems Reported',
      value: problemCount,
      description: 'Community pain points raised',
      icon: (
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      bgGlow: 'from-slate-500/10 to-transparent',
      borderColor: 'border-white/[0.08]',
    },
    {
      id: 'likes',
      label: 'Upvotes Received',
      value: totalLikes,
      description: 'Appreciation from peers',
      icon: (
        <svg className="h-6 w-6 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
      bgGlow: 'from-rose-500/10 to-transparent',
      borderColor: 'border-rose-800/40',
    },
  ];

  return (
    <section aria-label="Contribution Statistics" className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            data-testid={`profile-stat-${stat.id}`}
            className={`card-structured rounded-xl border ${stat.borderColor} bg-[#0C1018]/90 p-4 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {stat.description}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#080B12] border border-white/[0.08]">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
