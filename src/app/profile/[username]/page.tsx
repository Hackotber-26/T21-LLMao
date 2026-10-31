'use client';

import React, { use, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { PublicProfileResponse } from '@/types/api.types';
import { ProfileHeader, UserSolutions } from '@/components/profile';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

function ArrowLeftIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function AlertTriangleIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ProfileContent({ rawUsername }: { rawUsername: string }) {
  const cleanUsername = decodeURIComponent(rawUsername).trim();

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(cleanUsername)}`);
        if (res.status === 404) {
          throw new Error('User profile not found.');
        }
        if (!res.ok) {
          throw new Error(`Failed to load profile (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error?.message || 'Failed to retrieve profile');
        }
        if (isMounted) {
          setProfile(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred while loading this profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [cleanUsername]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <svg className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-slate-400">Loading builder profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">User Profile Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          The user <strong className="text-slate-200">@{cleanUsername}</strong> does not exist or may have been deleted.
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

  const totalLikes = (profile.solutions || []).reduce(
    (sum, sol) => sum + (sol.like_count || 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Discover
      </Link>

      {/* Header Profile Card */}
      <ProfileHeader
        profile={{
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          skills: profile.skills,
          interests: profile.interests,
          created_at: profile.created_at,
        }}
        stats={{
          problemCount: profile.problem_count || profile.recent_reports?.length || 0,
          solutionCount: profile.solution_count || profile.solutions?.length || 0,
          totalLikes: totalLikes,
        }}
      />

      {/* Submitted Solutions Section */}
      <UserSolutions
        solutions={profile.solutions || []}
        solver={{
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        }}
      />
    </div>
  );
}

function PageContent({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  return <ProfileContent rawUsername={username} />;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <svg className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-slate-400">Loading builder profile...</p>
        </div>
      }
    >
      <PageContent params={params} />
    </Suspense>
  );
}
