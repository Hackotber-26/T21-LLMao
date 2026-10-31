'use client';

import React from 'react';
import Link from 'next/link';
import { Problem } from '@/types/api.types';
import { Users, Code2, Tag, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';

interface ProblemCardProps {
  problem: Problem;
  solutionCount?: number;
}

export default function ProblemCard({ problem, solutionCount = 1 }: ProblemCardProps) {
  const urgencyColors = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const urgencyBadge =
    urgencyColors[(problem.urgency as keyof typeof urgencyColors) || 'medium'] ||
    urgencyColors.medium;

  const formattedDate = new Date(problem.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="group block relative rounded-xl border border-white/[0.08] bg-[#0B0F19]/75 backdrop-blur-md p-6 hover:border-cyan-500/40 hover:bg-[#0D1424]/90 transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-cyan-950/20 hover:-translate-y-0.5"
    >
      {/* Top Meta: Category & Urgency */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/30">
          {problem.category || 'General'}
        </span>

        <div className="flex items-center gap-2">
          {problem.urgency && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${urgencyBadge}`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span className="capitalize">{problem.urgency}</span>
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
              problem.status === 'open'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {problem.status}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2 leading-snug">
        {problem.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-300/90 line-clamp-3 leading-relaxed mb-4">
        {problem.description}
      </p>

      {/* Tags / Keywords */}
      {problem.keywords && problem.keywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {problem.keywords.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded"
            >
              <Tag className="w-2.5 h-2.5 text-slate-500" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Metrics Bar */}
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1.5 font-medium text-slate-200"
            title={`${problem.report_count} real-world user reports grouped into this cluster`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              <strong className="text-white">{problem.report_count}</strong> {problem.report_count === 1 ? 'report' : 'reports'}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 font-medium text-slate-200"
            title="Number of working solutions submitted"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              <strong className="text-white">{solutionCount}</strong> {solutionCount === 1 ? 'solution' : 'solutions'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-cyan-400 transition-colors">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}
