'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProblemDetailResponse } from '@/types/api.types';
import {
  Users,
  Code2,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ThumbsUp,
  Plus,
  MessageSquare,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  X,
  Monitor,
} from 'lucide-react';

function GithubIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function ProblemDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
          <p className="text-sm text-slate-400">Loading problem cluster details...</p>
        </div>
      }
    >
      <ProblemDetailContent />
    </Suspense>
  );
}

function ProblemDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [problem, setProblem] = useState<ProblemDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Solution Submission Form State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [solTitle, setSolTitle] = useState('');
  const [solDescription, setSolDescription] = useState('');
  const [solGithub, setSolGithub] = useState('');
  const [solDemo, setSolDemo] = useState('');
  const [solLive, setSolLive] = useState('');
  const [solSubmitting, setSolSubmitting] = useState(false);
  const [solError, setSolError] = useState<string | null>(null);
  const [solSuccess, setSolSuccess] = useState(false);

  // Like tracking state
  const [likedSolutions, setLikedSolutions] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchProblem() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.getProblemById(id);
        setProblem(data);

        // Initialize like counts
        if (data.solutions) {
          const counts: Record<string, number> = {};
          const liked: Record<string, boolean> = {};
          data.solutions.forEach((s) => {
            counts[s.id] = s.like_count || 0;
            liked[s.id] = !!s.has_liked;
          });
          setLikeCounts(counts);
          setLikedSolutions(liked);
        }
      } catch {
        setError('Failed to load problem statement.');
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [id]);

  const handleLike = async (solutionId: string) => {
    const isCurrentlyLiked = !!likedSolutions[solutionId];
    const currentCount = likeCounts[solutionId] || 0;

    // Optimistic UI update
    setLikedSolutions((prev) => ({ ...prev, [solutionId]: !isCurrentlyLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [solutionId]: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
    }));

    try {
      const res = await api.toggleLike(solutionId);
      setLikeCounts((prev) => ({ ...prev, [solutionId]: res.like_count }));
      setLikedSolutions((prev) => ({ ...prev, [solutionId]: res.liked }));
    } catch {
      // Revert if API fails
      setLikedSolutions((prev) => ({ ...prev, [solutionId]: isCurrentlyLiked }));
      setLikeCounts((prev) => ({ ...prev, [solutionId]: currentCount }));
    }
  };

  const handleSolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solTitle.trim() || !solDescription.trim()) {
      setSolError('Please provide a title and short description for your solution.');
      return;
    }
    if (!solGithub.trim() || !solGithub.startsWith('http')) {
      setSolError('Please provide a valid GitHub repository URL (e.g. https://github.com/...)');
      return;
    }

    setSolError(null);
    setSolSubmitting(true);

    try {
      const res = await api.submitSolution({
        problem_id: id,
        title: solTitle.trim(),
        description: solDescription.trim(),
        github_url: solGithub.trim(),
        demo_url: solDemo.trim() || undefined,
        live_url: solLive.trim() || undefined,
      });

      if (res.success) {
        setSolSuccess(true);
        // Refresh local problem solutions view
        const newSolution = {
          id: res.data?.id || `sol-${Date.now()}`,
          problem_id: id,
          user_id: 'current-user',
          title: solTitle.trim(),
          description: solDescription.trim(),
          github_url: solGithub.trim(),
          demo_url: solDemo.trim() || null,
          live_url: solLive.trim() || null,
          video_url: null,
          like_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          solver: {
            id: 'current-user',
            username: 'you',
            full_name: 'You (Contributor)',
            avatar_url: null,
          },
        };
        setProblem((prev) =>
          prev ? { ...prev, solutions: [newSolution, ...prev.solutions] } : prev
        );
        setTimeout(() => {
          setIsSubmitModalOpen(false);
          setSolSuccess(false);
          setSolTitle('');
          setSolDescription('');
          setSolGithub('');
          setSolDemo('');
          setSolLive('');
        }, 1500);
      } else {
        setSolError(res.error?.message || 'Failed to submit solution.');
      }
    } catch (err) {
      setSolError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSolSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading problem cluster details...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Problem Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          The requested problem cluster statement could not be loaded.
        </p>
        <Link
          href="/"
          className="btn-secondary inline-flex"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(problem.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
      </Link>

      {/* Main Problem Cluster Header Card */}
      <div className="card-structured p-6 sm:p-8 mb-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
              {problem.category}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] capitalize">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              {problem.urgency || 'medium'} urgency
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-black/40 text-slate-400 border border-white/[0.06]">
              {problem.status}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>Formed {formattedDate}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
          {problem.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {problem.description}
        </p>

        {/* Target Users */}
        {problem.target_users && problem.target_users.length > 0 && (
          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/30 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Affected Groups:</span>
            {problem.target_users.map((userGroup, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-200 border border-white/[0.08] font-medium"
              >
                {userGroup}
              </span>
            ))}
          </div>
        )}

        {/* Cluster Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-0.5">
              <Users className="w-3 h-3 text-rose-400" /> Total Reports
            </span>
            <span className="text-xl font-semibold text-white">{problem.report_count}</span>
          </div>

          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-0.5">
              <Code2 className="w-3 h-3 text-rose-400" /> Solutions Built
            </span>
            <span className="text-xl font-semibold text-white">
              {problem.solutions?.length || 0}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-white/[0.06] bg-black/40 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-0.5">
              <Layers className="w-3 h-3 text-rose-400" /> Sub-Problems
            </span>
            <span className="text-xl font-semibold text-white">
              {problem.sub_problems?.length || 1}
            </span>
          </div>
        </div>

        {/* Actions bar */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Provide a Solution</span>
          </button>

          <Link
            href={`/report?category=${encodeURIComponent(problem.category || '')}`}
            className="btn-secondary"
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            <span>Report a Similar Friction</span>
          </Link>
        </div>
      </div>

      {/* Grid: Left Column = Sub-problems & Individual Reports; Right Column = Solutions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sub-Problems & Raw Community Reports */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sub-Problems Breakdown */}
          <div className="card-structured p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                Identified Sub-Problems
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              AI decomposes user reports into distinct technical sub-problems:
            </p>

            <div className="space-y-2">
              {problem.sub_problems?.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-white/[0.06] bg-black/30 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-medium text-slate-200">{sub.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 font-mono text-[10px] shrink-0 border border-rose-800/40">
                    {sub.count} {sub.count === 1 ? 'rep' : 'reps'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Community Reports */}
          <div className="card-structured p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-rose-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Individual Reports
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Preserved</span>
            </div>

            <div className="space-y-2.5">
              {problem.sample_reports?.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-lg border border-white/[0.05] bg-black/40 text-xs space-y-1.5"
                >
                  <p className="text-slate-300 italic leading-relaxed">
                    &ldquo;{rep.original_text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                    <span className="text-rose-300 font-medium">{rep.sub_problem}</span>
                    <span>
                      {new Date(rep.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Submitted Solutions */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-rose-400" />
                Submitted Solutions ({problem.solutions?.length || 0})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Working codebases and live implementations built for this cluster.
              </p>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              + Add Solution
            </button>
          </div>

          {problem.solutions && problem.solutions.length > 0 ? (
            <div className="space-y-3.5">
              {problem.solutions.map((sol) => (
                <div
                  key={sol.id}
                  className="card-structured p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white hover:text-rose-300 transition-colors">
                        {sol.title}
                      </h3>
                      <span className="text-xs text-slate-400">
                        Built by{' '}
                        <strong className="text-slate-200">
                          @{sol.solver?.username || 'builder'}
                        </strong>
                      </span>
                    </div>

                    {/* Like button */}
                    <button
                      onClick={() => handleLike(sol.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                        likedSolutions[sol.id]
                          ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                          : 'bg-[#080B12] border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp
                        className={`w-3 h-3 ${
                          likedSolutions[sol.id] ? 'fill-rose-400 text-rose-400' : ''
                        }`}
                      />
                      <span>{likeCounts[sol.id] || 0}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {sol.description}
                  </p>

                  {/* External links */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-xs">
                    {sol.github_url && (
                      <a
                        href={sol.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080B12] border border-white/[0.08] text-slate-200 hover:text-white hover:border-white/[0.2] transition-colors"
                      >
                        <GithubIcon className="w-3.5 h-3.5" />
                        <span>GitHub Repo</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    )}

                    {sol.demo_url && (
                      <a
                        href={sol.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/50 transition-colors"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Interactive Demo</span>
                        <ExternalLink className="w-3 h-3 text-rose-400" />
                      </a>
                    )}

                    {sol.live_url && (
                      <a
                        href={sol.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080B12] border border-white/[0.08] text-slate-200 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live App</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-structured p-8 text-center space-y-2 border-dashed">
              <Code2 className="w-7 h-7 text-slate-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No solutions submitted yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Be the first engineer or team to propose an open-source solution or prototype for this cluster.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="btn-primary"
                >
                  Submit the First Solution
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Solution Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg card-structured p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Code2 className="w-4 h-4 text-rose-400" />
              <h3 className="text-base font-semibold text-white">Submit a Solution</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Link your repository and live demo for{' '}
              <strong className="text-slate-200">{problem.title}</strong>
            </p>

            {solSuccess ? (
              <div className="p-6 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">Solution Submitted</h4>
                <p className="text-xs text-slate-300">
                  Your solution has been attached to this problem cluster.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSolutionSubmit} className="space-y-4">
                {solError && (
                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {solError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Solution Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={solTitle}
                    onChange={(e) => setSolTitle(e.target.value)}
                    placeholder="e.g. Open-GTFS Real-Time Bus Tracker & PWA"
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#080B12] text-white text-xs focus:outline-none focus:border-rose-500/80"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Description &amp; Approach <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={solDescription}
                    onChange={(e) => setSolDescription(e.target.value)}
                    placeholder="Describe how your solution directly resolves the identified root sub-problems..."
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#080B12] text-white text-xs focus:outline-none focus:border-rose-500/80 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    GitHub Repository URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={solGithub}
                    onChange={(e) => setSolGithub(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#080B12] text-white text-xs focus:outline-none focus:border-rose-500/80"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Demo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={solDemo}
                      onChange={(e) => setSolDemo(e.target.value)}
                      placeholder="https://demo.app"
                      className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#080B12] text-white text-xs focus:outline-none focus:border-rose-500/80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Live App URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={solLive}
                      onChange={(e) => setSolLive(e.target.value)}
                      placeholder="https://app.com"
                      className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#080B12] text-white text-xs focus:outline-none focus:border-rose-500/80"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={solSubmitting}
                    className="btn-primary"
                  >
                    {solSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Submit Solution</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
