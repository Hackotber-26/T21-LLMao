'use client';

import React, { use, useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { PublicProfileResponse } from '@/types/api.types';
import { ProfileHeader, ProfileStats, UserSolutions } from '@/components/profile';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading profile...">
      {/* Header Skeleton */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
            <div className="h-16 w-full max-w-lg bg-zinc-100 dark:bg-zinc-800/40 rounded-lg" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
          />
        ))}
      </div>

      {/* Solutions Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
          <div className="h-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
        </div>
      </div>
    </div>
  );
}

function ProfileNotFound({ username }: { username: string }) {
  return (
    <div
      data-testid="profile-not-found"
      className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 sm:p-14 text-center shadow-xs"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-5 shadow-2xs">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        User Profile Not Found
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
        The user <span className="font-semibold text-emerald-600 dark:text-emerald-400">@{username}</span> does not exist or may have been deleted.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-semibold hover:opacity-90 transition shadow-xs"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Return to Community Home</span>
        </Link>
      </div>
    </div>
  );
}

function ProfileErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div
      data-testid="profile-error"
      className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-8 sm:p-12 text-center"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 mb-4">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-rose-900 dark:text-rose-200">
        Unable to Load Profile
      </h2>
      <p className="mt-1 text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto">
        {error}
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs sm:text-sm font-semibold transition shadow-xs"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

function ProfileView({ rawUsername }: { rawUsername: string }) {
  const cleanUsername = decodeURIComponent(rawUsername).trim();

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await fetch(`/api/profile/${encodeURIComponent(cleanUsername)}`);

        if (response.status === 404) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load profile (HTTP ${response.status})`);
        }

        const json = await response.json();
        if (!json.success || !json.data) {
          if (json.error?.code === 'NOT_FOUND') {
            if (isMounted) {
              setNotFound(true);
              setLoading(false);
            }
            return;
          }
          throw new Error(json.error?.message || 'Failed to retrieve profile');
        }

        if (isMounted) {
          setProfile(json.data);
          setError(null);
          setNotFound(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'An unexpected error occurred while loading this profile.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [cleanUsername, retryCount]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (notFound) {
    return <ProfileNotFound username={cleanUsername} />;
  }

  if (error || !profile) {
    return (
      <ProfileErrorState
        error={error || 'Profile could not be loaded.'}
        onRetry={handleRetry}
      />
    );
  }

  // Calculate total upvotes across all solutions submitted by user
  const totalLikes = (profile.solutions || []).reduce(
    (accum, sol) => accum + (sol.like_count || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Profile Header */}
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
      />

      {/* Profile Statistics */}
      <ProfileStats
        solutionCount={profile.solution_count ?? profile.solutions?.length ?? 0}
        problemCount={profile.problem_count ?? profile.recent_reports?.length ?? 0}
        totalLikes={totalLikes}
      />

      {/* Submitted Solutions */}
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
  return <ProfileView rawUsername={username} />;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation Breadcrumb */}
      <div className="max-w-4xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Problems</span>
        </Link>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto">
        <Suspense fallback={<ProfileSkeleton />}>
          <PageContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}
