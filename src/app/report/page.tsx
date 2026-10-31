'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api, SubmitReportResponseData } from '@/lib/api';
import {
  Sparkles,
  ArrowRight,
  Send,
  MapPin,
  Layers,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  CornerDownRight,
} from 'lucide-react';

const CATEGORIES = [
  'Transportation',
  'Healthcare',
  'Civic Infrastructure',
  'Agriculture & Food',
  'Education',
  'Environment',
  'Consumer & Retail',
  'Other',
];

export default function ReportProblemPage() {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitReportResponseData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 15) {
      setError('Please provide at least 15 characters describing the everyday problem.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await api.submitReport({
        original_text: description.trim(),
        category: category || undefined,
        location: location.trim() || undefined,
      });

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error?.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setDescription('');
    setCategory('');
    setLocation('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Natural Language AI Ingestion</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Report an Everyday Problem
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Describe the challenge you faced in your own words. Our AI analyzes your report, identifies
          underlying root sub-problems, and clusters it with similar community experiences.
        </p>
      </div>

      {result ? (
        /* AI Clustering Result Card */
        <div className="rounded-2xl border border-white/[0.12] bg-[#0C1019]/85 backdrop-blur-xl p-8 shadow-2xl shadow-black/60 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  AI Clustering Status
                </span>
                {result.ai_matching?.confidence && (
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-950/50 border border-rose-800/50 text-rose-300">
                    {Math.round(result.ai_matching.confidence * 100)}% match confidence
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {result.ai_matching?.match_found
                  ? 'Attached to Existing Problem Cluster'
                  : 'New Problem Cluster Created!'}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                {result.ai_matching?.reason ||
                  'Your experience has been processed and organized into an actionable developer statement.'}
              </p>
            </div>
          </div>

          {/* Problem Cluster Details */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <span className="text-xs font-medium text-slate-400">Target Problem Cluster</span>
              <h3 className="text-base font-semibold text-white mt-1">
                {result.problem.title}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span>
                  Total Community Reports:{' '}
                  <strong className="text-rose-300 font-semibold">
                    {result.problem.report_count}
                  </strong>
                </span>
                <span>
                  Status:{' '}
                  <strong className="text-slate-200 capitalize">
                    {result.problem.status}
                  </strong>
                </span>
              </div>
            </div>

            {/* Identified Sub-Problem */}
            {result.ai_matching?.sub_problem && (
              <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-950/20">
                <span className="text-xs font-medium text-rose-300 flex items-center gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  Identified Root Sub-Problem
                </span>
                <p className="text-sm font-semibold text-white mt-1">
                  {result.ai_matching.sub_problem}
                </p>
              </div>
            )}

            {/* Original Report Preservation Confirmation */}
            <div className="p-4 rounded-xl border border-white/[0.05] bg-black/30">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Preserved Original Human Voice
              </span>
              <p className="text-xs text-slate-300 italic">
                &ldquo;{result.report.original_text}&rdquo;
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/problems/${result.problem.id}`}
              className="btn-primary-glow w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-lg transition-all"
            >
              <span>View Problem Cluster &amp; Solutions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-medium text-sm text-slate-300 hover:text-white border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              Report Another Problem
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/[0.1] bg-[#0C1019]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6"
        >
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Natural Language Text Area */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-white mb-2"
            >
              What is the problem you are experiencing? <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: I cannot track BMTC buses in real-time. Bus 500D arrivals on the app are constantly incorrect or disappear, causing commuters to wait over 45 minutes on the Outer Ring Road..."
              className="w-full px-4 py-3.5 rounded-xl border border-white/[0.12] bg-[#080B12]/90 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all resize-y"
              required
            />
            <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
              <span>Be as descriptive as you like. Everyday slang or raw notes are fine.</span>
              <span className={description.length >= 15 ? 'text-rose-400' : 'text-slate-500'}>
                {description.length} chars (min 15)
              </span>
            </div>
          </div>

          {/* Category & Location Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                Category (Optional)
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#080B12]/90 text-white text-sm focus:outline-none focus:border-rose-500/60"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-pink-400" />
                Location / City (Optional)
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#080B12]/90 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500/60"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-glow w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-white shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>AI is classifying and clustering your report...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Problem Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
