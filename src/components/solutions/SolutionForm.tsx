'use client';

import React, { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Solution } from '@/types/api.types';
import { createClient } from '@/lib/supabase/client';
import {
  SolutionFormSchema,
  validateUrlWithConstructor,
} from '@/lib/validations/solution-form';

export interface SolutionFormProps {
  /** The UUID of the problem being solved */
  problemId: string;
  /** Optional title of the problem for context */
  problemTitle?: string;
  /** Optional callback fired when submission succeeds */
  onSuccess?: (solution: Solution) => void;
  /** Optional cancel handler */
  onCancel?: () => void;
  /** Custom redirect route after success (defaults to /solutions/[id]) */
  redirectTo?: string;
  /** Additional CSS class names */
  className?: string;
}

interface FormState {
  title: string;
  description: string;
  github_url: string;
  demo_url: string;
  live_url: string;
  video_url: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  github_url?: string;
  demo_url?: string;
  live_url?: string;
  video_url?: string;
  general?: string;
}

export function SolutionForm({
  problemId,
  problemTitle,
  onSuccess,
  onCancel,
  redirectTo,
  className = '',
}: SolutionFormProps) {
  const router = useRouter();
  const formId = useId();

  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    github_url: '',
    demo_url: '',
    live_url: '',
    video_url: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submittedSolution, setSubmittedSolution] = useState<Solution | null>(null);

  // Authentication status check
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(
            currentUser ? { id: currentUser.id, email: currentUser.email } : null
          );
        }
      } catch {
        // In environments without Supabase env vars set yet or network offline
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setApiError(null);

    // Validate field on change if touched
    if (touched[name]) {
      validateSingleField(name, value);
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateSingleField(name, value);
  };

  const validateSingleField = (name: string, value: string) => {
    let fieldError: string | undefined;

    switch (name) {
      case 'title':
        if (!value.trim()) {
          fieldError = 'Solution title is required';
        } else if (value.trim().length < 3) {
          fieldError = 'Title must be at least 3 characters';
        } else if (value.trim().length > 200) {
          fieldError = 'Title cannot exceed 200 characters';
        }
        break;
      case 'description':
        if (!value.trim()) {
          fieldError = 'Solution description is required';
        } else if (value.trim().length < 20) {
          fieldError = 'Description must be at least 20 characters';
        } else if (value.trim().length > 5000) {
          fieldError = 'Description cannot exceed 5000 characters';
        }
        break;
      case 'github_url': {
        const res = validateUrlWithConstructor(value, 'github');
        if (!res.isValid) fieldError = res.error;
        break;
      }
      case 'video_url':
      case 'live_url':
      case 'demo_url': {
        const res = validateUrlWithConstructor(value, 'https');
        if (!res.isValid) fieldError = res.error;
        break;
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));

    return !fieldError;
  };

  const validateAll = (): boolean => {
    const parseResult = SolutionFormSchema.safeParse({
      problem_id: problemId,
      title: formData.title,
      description: formData.description,
      github_url: formData.github_url || undefined,
      video_url: formData.video_url || undefined,
      live_url: formData.live_url || undefined,
      demo_url: formData.demo_url || undefined,
    });

    if (!parseResult.success) {
      const fieldErrors: FormErrors = {};
      const zodFormatted = parseResult.error.format();

      if (zodFormatted.title?._errors?.length) {
        fieldErrors.title = zodFormatted.title._errors[0];
      }
      if (zodFormatted.description?._errors?.length) {
        fieldErrors.description = zodFormatted.description._errors[0];
      }
      if (zodFormatted.github_url?._errors?.length) {
        fieldErrors.github_url = zodFormatted.github_url._errors[0];
      }
      if (zodFormatted.video_url?._errors?.length) {
        fieldErrors.video_url = zodFormatted.video_url._errors[0];
      }
      if (zodFormatted.live_url?._errors?.length) {
        fieldErrors.live_url = zodFormatted.live_url._errors[0];
      }
      if (zodFormatted.demo_url?._errors?.length) {
        fieldErrors.demo_url = zodFormatted.demo_url._errors[0];
      }
      if (zodFormatted.problem_id?._errors?.length) {
        fieldErrors.general = zodFormatted.problem_id._errors[0];
      }

      setErrors(fieldErrors);
      setTouched({
        title: true,
        description: true,
        github_url: true,
        demo_url: true,
        live_url: true,
        video_url: true,
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Validate form inputs
    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        problem_id: problemId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        github_url: formData.github_url.trim() || null,
        demo_url: formData.demo_url.trim() || null,
        live_url: formData.live_url.trim() || null,
        video_url: formData.video_url.trim() || null,
      };

      const response = await fetch('/api/solutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg =
          result.error?.message ||
          (response.status === 401
            ? 'Authentication required. Please sign in to submit a solution.'
            : 'Failed to submit solution');
        setApiError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const createdSolution: Solution = result.data;
      setSubmittedSolution(createdSolution);
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess(createdSolution);
      }

      // Automatically navigate if route is configured
      const destination = redirectTo || `/solutions/${createdSolution.id}`;
      // Allow brief moment for success animation
      setTimeout(() => {
        router.push(destination);
      }, 1200);
    } catch (err) {
      console.error('Error submitting solution:', err);
      setApiError(
        err instanceof Error
          ? err.message
          : 'Network error occurred while submitting solution'
      );
      setIsSubmitting(false);
    }
  };

  // Render Success Card
  if (submittedSolution) {
    return (
      <div
        className={`w-full max-w-2xl mx-auto rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-8 text-center dark:bg-emerald-950/20 dark:border-emerald-500/30 ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Solution Submitted Successfully!
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          &ldquo;{submittedSolution.title}&rdquo; has been posted. Redirecting you to the solution page...
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(redirectTo || `/solutions/${submittedSolution.id}`)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition"
          >
            View Solution Now
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmittedSolution(null);
              setFormData({
                title: '',
                description: '',
                github_url: '',
                demo_url: '',
                live_url: '',
                video_url: '',
              });
              setTouched({});
              setErrors({});
            }}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`w-full max-w-3xl mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm transition-all ${className}`}
    >
      {/* Header */}
      <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Submit a Solution
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {problemTitle
                ? `Solving: ${problemTitle}`
                : 'Share your working implementation, repository, or prototype.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open Challenge
          </span>
        </div>
      </div>

      {/* Auth State Alert */}
      {!authLoading && !user && (
        <div
          className="mb-6 rounded-xl border border-amber-300/50 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm">
              <span className="font-semibold">Sign in required:</span> You must be signed in to submit a solution. If you proceed, the server will request authentication.
            </div>
          </div>
        </div>
      )}

      {/* API / General Error Banner */}
      {(apiError || errors.general) && (
        <div
          className="mb-6 rounded-xl border border-rose-300/60 bg-rose-50/80 p-4 dark:border-rose-900/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm">
              <p className="font-semibold">Submission Error</p>
              <p className="mt-0.5">{apiError || errors.general}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Field 1: Title */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor={`${formId}-title`}
              className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Solution Title <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${
                formData.title.length > 200
                  ? 'text-rose-500 font-semibold'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {formData.title.length}/200
            </span>
          </div>
          <input
            id={`${formId}-title`}
            name="title"
            type="text"
            required
            disabled={isSubmitting}
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Real-Time Distributed Queue with Priority Partitioning"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? `${formId}-title-error` : undefined}
            className={`mt-2 block w-full rounded-xl border px-3.5 py-2.5 text-sm transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-100 focus:outline-hidden ${
              errors.title
                ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400 dark:ring-rose-500'
                : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
          {errors.title && (
            <p
              id={`${formId}-title-error`}
              className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.title}
            </p>
          )}
        </div>

        {/* Field 2: Description */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor={`${formId}-description`}
              className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Description & Methodology <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${
                formData.description.length > 5000
                  ? 'text-rose-500 font-semibold'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {formData.description.length}/5000
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Explain your architecture, tech stack, approach, and how it resolves the root cause. (Minimum 20 characters)
          </p>
          <textarea
            id={`${formId}-description`}
            name="description"
            rows={5}
            required
            disabled={isSubmitting}
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Outline your approach: 1. System architecture, 2. Key tradeoffs, 3. How to reproduce/run the solution..."
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? `${formId}-description-error` : undefined}
            className={`mt-2 block w-full rounded-xl border px-3.5 py-2.5 text-sm transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-100 focus:outline-hidden ${
              errors.description
                ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400 dark:ring-rose-500'
                : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
          {errors.description && (
            <p
              id={`${formId}-description-error`}
              className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.description}
            </p>
          )}
        </div>

        {/* Section: External Links (Optional) */}
        <div className="pt-2">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Links & Artifacts
            </h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">
              (Optional — add one or more)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Field 3: GitHub URL */}
            <div>
              <label
                htmlFor={`${formId}-github_url`}
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                GitHub Repository
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </div>
                <input
                  id={`${formId}-github_url`}
                  name="github_url"
                  type="url"
                  disabled={isSubmitting}
                  value={formData.github_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://github.com/org/repo"
                  aria-invalid={!!errors.github_url}
                  className={`block w-full rounded-xl border pl-9 pr-3 py-2 text-xs sm:text-sm transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-100 focus:outline-hidden ${
                    errors.github_url
                      ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400 dark:ring-rose-500'
                      : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {errors.github_url && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.github_url}
                </p>
              )}
            </div>

            {/* Field 4: Demo Video URL */}
            <div>
              <label
                htmlFor={`${formId}-video_url`}
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Demo Video Walkthrough
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id={`${formId}-video_url`}
                  name="video_url"
                  type="url"
                  disabled={isSubmitting}
                  value={formData.video_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://youtube.com/... or https://loom.com/..."
                  aria-invalid={!!errors.video_url}
                  className={`block w-full rounded-xl border pl-9 pr-3 py-2 text-xs sm:text-sm transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-100 focus:outline-hidden ${
                    errors.video_url
                      ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400 dark:ring-rose-500'
                      : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {errors.video_url && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.video_url}
                </p>
              )}
            </div>

            {/* Field 5: Live Application URL */}
            <div>
              <label
                htmlFor={`${formId}-live_url`}
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Live Application
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <input
                  id={`${formId}-live_url`}
                  name="live_url"
                  type="url"
                  disabled={isSubmitting}
                  value={formData.live_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://mysolution.vercel.app"
                  aria-invalid={!!errors.live_url}
                  className={`block w-full rounded-xl border pl-9 pr-3 py-2 text-xs sm:text-sm transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-100 focus:outline-hidden ${
                    errors.live_url
                      ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400 dark:ring-rose-500'
                      : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {errors.live_url && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.live_url}
                </p>
              )}
            </div>

            {/* Field 6: Prototype / Figma URL */}
            <div>
              <label
                htmlFor={`${formId}-demo_url`}
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Prototype / Figma / Demo
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <input
                  id={`${formId}-demo_url`}
                  name="demo_url"
                  type="url"
                  disabled={isSubmitting}
                  value={formData.demo_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://figma.com/file/..."
                  aria-invalid={!!errors.demo_url}
                  className={`block w-full rounded-xl border pl-9 pr-3 py-2 text-xs sm:text-sm transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-100 focus:outline-hidden ${
                    errors.demo_url
                      ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400 dark:ring-rose-500'
                      : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {errors.demo_url && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.demo_url}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-zinc-100 dark:border-zinc-800 pt-5">
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-400 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting Solution...
            </span>
          ) : (
            'Publish Solution'
          )}
        </button>
      </div>
    </form>
  );
}
