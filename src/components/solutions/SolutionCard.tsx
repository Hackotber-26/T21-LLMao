'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Solution } from '@/types/api.types';
import { ExternalResourceLinks } from './ExternalResourceLinks';
import { LikeButton } from './LikeButton';

export interface SolutionCardProps {
  solution: Solution & {
    solver?: {
      id: string;
      username: string;
      full_name?: string | null;
      avatar_url?: string | null;
    } | null;
    problem?: {
      id: string;
      title: string;
      category?: string | null;
      status?: string | null;
    } | null;
    has_liked?: boolean;
  };
  /** Whether to show a link to the parent problem */
  showProblemContext?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * Format ISO timestamp into a user-friendly date string.
 */
export function formatSubmissionDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Recently';
  }
}

/**
 * Generate avatar fallback initials from name or username.
 */
export function getAvatarInitials(name?: string | null, fallback = '?'): string {
  if (!name || !name.trim()) return fallback.toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function SolutionCard({
  solution,
  showProblemContext = false,
  className = '',
}: SolutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    id,
    title,
    description,
    github_url,
    live_url,
    video_url,
    demo_url,
    like_count,
    created_at,
    solver,
    problem,
    has_liked,
  } = solution;

  const solverName = solver?.full_name || solver?.username || 'Anonymous Solver';
  const solverHandle = solver?.username ? `@${solver.username}` : '';
  const formattedDate = formatSubmissionDate(created_at);
  const initials = getAvatarInitials(solver?.full_name || solver?.username, 'S');

  const isLongDescription = description.length > 280;
  const displayDescription =
    isLongDescription && !isExpanded
      ? `${description.slice(0, 280)}...`
      : description;

  return (
    <article
      data-testid={`solution-card-${id}`}
      className={`card-structured rounded-xl border border-white/[0.08] bg-[#0C1018]/90 p-5 space-y-3 hover:border-white/[0.16] hover:bg-[#0F1420] transition-all ${className}`}
    >
      <div>
        {/* Top Header: Solver Info & Like Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Solver Profile Avatar with Fallback */}
            {solver?.username ? (
              <Link
                href={`/profile/${solver.username}`}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-[#080B12] border border-white/[0.1] text-rose-400 font-semibold text-xs hover:border-white/[0.25] transition-colors"
                aria-label={`View ${solverName}'s profile`}
              >
                {solver?.avatar_url ? (
                  <Image
                    src={solver.avatar_url}
                    alt={solverName}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </Link>
            ) : (
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-[#080B12] border border-white/[0.1] text-rose-400 font-semibold text-xs">
                {solver?.avatar_url ? (
                  <Image
                    src={solver.avatar_url}
                    alt={solverName}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            )}

            {/* Title & Solver Handle */}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white hover:text-rose-300 transition-colors leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Built by{' '}
                {solver?.username ? (
                  <Link
                    href={`/profile/${solver.username}`}
                    className="text-slate-200 hover:text-rose-400 font-medium transition-colors"
                  >
                    {solverHandle}
                  </Link>
                ) : (
                  <strong className="text-slate-200">{solverName}</strong>
                )}
                <span className="mx-1.5 text-slate-600">•</span>
                <time dateTime={created_at} className="text-[11px] text-slate-500 font-mono">
                  {formattedDate}
                </time>
              </p>
            </div>
          </div>

          {/* Interactive Like Button */}
          <LikeButton
            solutionId={id}
            initialLikeCount={like_count}
            initialHasLiked={has_liked ?? false}
            size="sm"
          />
        </div>

        {/* Problem Context Reference (if requested and present) */}
        {showProblemContext && problem && (
          <div className="mt-2.5">
            <Link
              href={`/problems/${problem.id}`}
              className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium shrink-0"
            >
              <span>Problem: {problem.title}</span>
              <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        )}

        {/* Description Excerpt with Expand Option */}
        <div className="mt-2.5 text-xs text-slate-300 leading-relaxed font-normal">
          <p className="whitespace-pre-line">{displayDescription}</p>
          {isLongDescription && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-xs font-semibold text-rose-400 hover:text-rose-300 focus:outline-hidden"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* Footer: External Resource Links */}
      <div className="pt-2 border-t border-white/[0.06]">
        <ExternalResourceLinks
          githubUrl={github_url}
          liveUrl={live_url}
          videoUrl={video_url}
          demoUrl={demo_url}
          size="sm"
        />
      </div>
    </article>
  );
}
