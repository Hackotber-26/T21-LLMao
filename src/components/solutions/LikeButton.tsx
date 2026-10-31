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
        className={`group relative inline-flex items-center rounded-md font-medium transition-colors select-none focus:outline-hidden focus:ring-1 focus:ring-rose-500/50 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed border ${sizeClasses} ${
          hasLiked
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-xs'
            : 'bg-[#080B12] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.2]'
        } ${className}`}
      >
        {/* ThumbsUp Icon */}
        <span
          className={`inline-flex transition-transform duration-150 ${
            hasLiked ? 'scale-110 text-rose-400' : 'text-slate-400 group-hover:text-white'
          }`}
        >
          {hasLiked ? (
            <svg
              className={`${iconSize} fill-rose-400 text-rose-400`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8 0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 3 7.59 9.41C7.21 9.79 7 10.3 7 10.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-.04-.01-.08-.01-.12z" />
            </svg>
          ) : (
            <svg
              className={iconSize}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
          )}
        </span>

        {/* Like Count */}
        <span
          data-testid={`like-count-${solutionId}`}
          className={`tabular-nums font-mono transition-colors duration-150 ${
            hasLiked ? 'font-semibold text-rose-300' : 'text-slate-300'
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
