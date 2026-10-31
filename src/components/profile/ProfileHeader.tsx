'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getAvatarInitials } from '@/components/solutions/SolutionCard';

export interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    skills?: string[] | null;
    interests?: string[] | null;
    created_at?: string;
  };
  className?: string;
}

/**
 * Format ISO timestamp into a member join date string.
 */
export function formatJoinDate(dateString?: string): string {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Recently';
  }
}

export function ProfileHeader({ profile, className = '' }: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);

  const {
    username,
    full_name,
    avatar_url,
    bio,
    skills,
    interests,
    created_at,
  } = profile;

  const displayName = full_name?.trim() || username;
  const initials = getAvatarInitials(displayName, username.slice(0, 2) || 'U');
  const joinedDate = formatJoinDate(created_at);

  const validSkills = Array.isArray(skills) ? skills.filter((s) => typeof s === 'string' && s.trim().length > 0) : [];
  const validInterests = Array.isArray(interests) ? interests.filter((i) => typeof i === 'string' && i.trim().length > 0) : [];

  return (
    <section
      aria-label="User Profile Header"
      className={`relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xs ${className}`}
    >
      {/* Decorative gradient header strip */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Avatar with fallback */}
        <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-2xl sm:text-3xl shadow-md border-2 border-white dark:border-zinc-800">
          {avatar_url && !imageError ? (
            <Image
              src={avatar_url}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              unoptimized
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* User Identity Details */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Community Member
              </span>
            </div>

            <p className="mt-0.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              @{username}
            </p>
          </div>

          {/* Member since metadata */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <svg className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Joined {joinedDate}</span>
          </div>

          {/* Bio statement */}
          {bio && bio.trim().length > 0 ? (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-line pt-1">
              {bio.trim()}
            </p>
          ) : (
            <p className="text-sm italic text-zinc-400 dark:text-zinc-500 pt-1">
              No bio provided yet.
            </p>
          )}

          {/* Skills and Interests Badges */}
          {(validSkills.length > 0 || validInterests.length > 0) && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
              {/* Skills */}
              {validSkills.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {validSkills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {validInterests.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    <svg className="h-3.5 w-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Interests</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {validInterests.map((interest, index) => (
                      <span
                        key={`${interest}-${index}`}
                        className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
