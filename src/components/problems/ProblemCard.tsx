'use client';

import React from 'react';
import Link from 'next/link';
import { Problem } from '@/types/api.types';
import { Users, Code2, Tag, ArrowRight, AlertTriangle } from 'lucide-react';

interface ProblemCardProps {
  problem: Problem;
  solutionCount?: number;
}

export default function ProblemCard({ problem, solutionCount = 0 }: ProblemCardProps) {
  const urgencyStyles = {
    low: 'text-slate-400 border-slate-700 bg-slate-900/40',
    medium: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
    high: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
    critical: 'text-rose-300 border-rose-500/50 bg-rose-900/30 font-semibold',
  };

  const urgencyClass =
    urgencyStyles[(problem.urgency as keyof typeof urgencyStyles) || 'medium'] ||
    urgencyStyles.medium;

  const formattedDate = new Date(problem.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="card-structured group flex flex-col justify-between p-5 hover:-translate-y-0.5"
    >
      <div>
        {/* Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300">
              {problem.category || 'General'}
            </span>
            {problem.urgency && (
              <span
                className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${urgencyClass}`}
              >
                {problem.urgency}
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-500 font-mono">{formattedDate}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug mb-1.5">
          {problem.title}
        </h3>

        {/* Short description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {problem.description}
        </p>

        {/* Keywords */}
        {problem.keywords && problem.keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-4">
            {problem.keywords.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] text-slate-400 bg-black/40 border border-white/[0.05] px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1" title="Community reports">
            <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
            <span className="text-slate-300 font-medium">{problem.report_count}</span>
            <span className="text-[11px] text-slate-500">reports</span>
          </div>

          <div className="flex items-center gap-1" title="Submitted solutions">
            <Code2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
            <span className="text-slate-300 font-medium">{solutionCount}</span>
            <span className="text-[11px] text-slate-500">solutions</span>
          </div>
        </div>

        <span className="text-xs text-slate-500 group-hover:text-rose-400 flex items-center gap-1 font-medium transition-colors">
          View cluster <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
