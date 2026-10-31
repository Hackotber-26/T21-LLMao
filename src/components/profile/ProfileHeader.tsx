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
  stats?: {
    solutionCount: number;
    problemCount: number;
    totalLikes?: number;
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

export function ProfileHeader({ profile, stats, className = '' }: ProfileHeaderProps) {
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
      className={`card-structured rounded-xl border border-white/[0.08] bg-[#0C1018]/90 backdrop-blur-md p-6 sm:p-7 mb-8 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        {/* Avatar with fallback */}
        <div className="w-16 h-16 rounded-xl bg-[#080B12] border border-white/[0.1] flex items-center justify-center text-rose-400 shrink-0 overflow-hidden relative">
          {avatar_url && !imageError ? (
            <Image
              src={avatar_url}
              alt={displayName}
              fill
              sizes="64px"
              unoptimized
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : initials ? (
            <span className="font-semibold text-lg">{initials}</span>
          ) : (
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>

        {/* User Identity Details */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-white mb-0.5">
            {displayName}
          </h1>
          <p className="text-xs text-rose-400 font-mono mb-2">@{username}</p>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mb-3">
            {bio?.trim() || 'Active contributor and problem solver on Solvyn.'}
          </p>

          {/* Member since metadata */}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 font-mono mb-3">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Joined {joinedDate}</span>
          </div>

          {/* Skills */}
          {validSkills.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              {validSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#080B12] border border-white/[0.08] text-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Interests */}
          {validInterests.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
              {validInterests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-slate-400"
                >
                  #{interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats Badges if provided */}
        {stats && (
          <div className="flex sm:flex-col gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-lg border border-white/[0.08] bg-[#080B12] text-center min-w-[5rem]">
              <span className="block text-lg font-semibold text-white">
                {stats.problemCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Reported</span>
            </div>
            <div className="px-3.5 py-2 rounded-lg border border-white/[0.08] bg-[#080B12] text-center min-w-[5rem]">
              <span className="block text-lg font-semibold text-white">
                {stats.solutionCount ?? 0}
              </span>
              <span className="text-[10px] text-rose-400 uppercase tracking-wider">Solutions</span>
            </div>
            {typeof stats.totalLikes === 'number' && stats.totalLikes > 0 && (
              <div className="px-3.5 py-2 rounded-lg border border-rose-800/40 bg-rose-950/20 text-center min-w-[5rem]">
                <span className="block text-lg font-semibold text-rose-300">
                  {stats.totalLikes}
                </span>
                <span className="text-[10px] text-rose-400 uppercase tracking-wider">Upvotes</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
