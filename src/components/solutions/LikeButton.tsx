'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface LikeButtonProps {
  /** The UUID of the solution */
  solutionId: string;
  /** Initial count of likes */
  initialLikeCount?: number;
  /** Whether the authenticated user has already liked this solution */
  initialHasLiked?: boolean;
  /** Optional callback fired when like state changes */
  onLikeChange?: (hasLiked: boolean, count: number) => void;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export function LikeButton({
  solutionId,
  initialLikeCount = 0,
  initialHasLiked = false,
  onLikeChange,
  size = 'md',
  className = '',
}: LikeButtonProps) {
  const [hasLiked, setHasLiked] = useState<boolean>(initialHasLiked);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // In-flight guard ref to guarantee zero rapid double-submission race conditions
  const isRequestInFlight = useRef<boolean>(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (isMounted) {
          setIsAuthenticated(!!user);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(null);
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    };
  }, []);

  const showTemporaryMessage = (msg: string) => {
    setAuthError(msg);
    if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    authTimeoutRef.current = setTimeout(() => {
      setAuthError(null);
    }, 3500);
  };

  const handleToggleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event bubbling so clicking the like button doesn't trigger card navigation
    e.stopPropagation();
    e.preventDefault();

    // Guard: Prevent rapid duplicate requests if already pending
    if (isPending || isRequestInFlight.current) {
      return;
    }

    // Check if user is known to be unauthenticated
    if (isAuthenticated === false) {
      showTemporaryMessage('Please sign in to like this solution');
      return;
    }

    // Capture previous state for rollback on error
    const previousHasLiked = hasLiked;
    const previousLikeCount = likeCount;

    // 1. Optimistic Update
    const optimisticHasLiked = !previousHasLiked;
    const optimisticCount = optimisticHasLiked
      ? previousLikeCount + 1
      : Math.max(0, previousLikeCount - 1);

    setHasLiked(optimisticHasLiked);
    setLikeCount(optimisticCount);
    setIsPending(true);
    isRequestInFlight.current = true;
    setAuthError(null);

    try {
      const response = await fetch(`/api/solutions/${solutionId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Roll back optimistic state immediately
        setHasLiked(previousHasLiked);
        setLikeCount(previousLikeCount);

        if (response.status === 401) {
          setIsAuthenticated(false);
          showTemporaryMessage('Please sign in to like solutions');
        } else {
          showTemporaryMessage(
            result.error?.message || 'Unable to update like. Please try again.'
          );
        }
        return;
      }

      // 2. Synchronize with fresh backend data
      const confirmedLiked: boolean = result.data.liked;
      const confirmedCount: number = result.data.like_count;

      setHasLiked(confirmedLiked);
      setLikeCount(confirmedCount);
      setIsAuthenticated(true);

      if (onLikeChange) {
        onLikeChange(confirmedLiked, confirmedCount);
      }
    } catch (err) {
      console.error('Like toggle request failed:', err);
      // Roll back optimistic update
      setHasLiked(previousHasLiked);
      setLikeCount(previousLikeCount);
      showTemporaryMessage('Network error. Failed to update like.');
    } finally {
      setIsPending(false);
      isRequestInFlight.current = false;
    }
  };

  // Size styling
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs sm:text-sm gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  }[size];

  const iconSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isPending}
        aria-label={hasLiked ? `Unlike solution (${likeCount})` : `Like solution (${likeCount})`}
        aria-pressed={hasLiked}
        data-testid={`like-button-${solutionId}`}
        className={`group relative inline-flex items-center rounded-full font-semibold transition-all duration-150 select-none focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed border ${sizeClasses} ${
          hasLiked
            ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs'
            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
        } ${className}`}
      >
        {/* Heart Icon with animated scale pop on liked state */}
        <span
          className={`inline-flex transition-transform duration-200 ${
            hasLiked ? 'scale-110 text-rose-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-rose-400'
          }`}
        >
          {hasLiked ? (
            <svg
              className={iconSize}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className={iconSize}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </span>

        {/* Like Count */}
        <span
          data-testid={`like-count-${solutionId}`}
          className={`tabular-nums transition-colors duration-150 ${
            hasLiked ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300'
          }`}
        >
          {likeCount}
        </span>

        {/* Loading Spinner Pulse */}
        {isPending && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
        )}
      </button>

      {/* Floating Auth Notification Popover */}
      {authError && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2.5 py-1 font-medium shadow-lg animate-bounce"
        >
          {authError}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
        </div>
      )}
    </div>
  );
}
