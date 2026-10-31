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
      className={`group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all ${className}`}
    >
      <div>
        {/* Top Header: Solver Info & Submission Date */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Solver Profile Avatar with Fallback */}
            {solver?.username ? (
              <Link
                href={`/profile/${solver.username}`}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity"
                aria-label={`View ${solverName}'s profile`}
              >
                {solver?.avatar_url ? (
                  <Image
                    src={solver.avatar_url}
                    alt={solverName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </Link>
            ) : (
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-semibold text-xs shadow-xs">
                {solver?.avatar_url ? (
                  <Image
                    src={solver.avatar_url}
                    alt={solverName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            )}

            {/* Solver Name & Handle */}
            <div className="min-w-0">
              {solver?.username ? (
                <Link
                  href={`/profile/${solver.username}`}
                  className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors block"
                >
                  {solverName}
                </Link>
              ) : (
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {solverName}
                </p>
              )}
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {solverHandle ? (
                  <span>{solverHandle}</span>
                ) : (
                  <span>Verified Contributor</span>
                )}
                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">•</span>
                <time dateTime={created_at}>{formattedDate}</time>
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
          <div className="mt-3.5">
            <Link
              href={`/problems/${problem.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Problem: {problem.title}</span>
            </Link>
          </div>
        )}

        {/* Solution Title */}
        <h3 className="mt-4 text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>

        {/* Description Excerpt with Expand Option */}
        <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <p className="whitespace-pre-line">{displayDescription}</p>
          {isLongDescription && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 focus:outline-hidden"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* Footer: External Resource Links */}
      <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
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
