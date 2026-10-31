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
  ArrowLeft,
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-rose-500/25 bg-rose-950/20 text-rose-300 text-xs font-medium mb-3">
          <Sparkles className="w-3 h-3 text-rose-400" />
          <span>Natural Language Ingestion</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
          Report an Everyday Problem
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Describe the challenge you faced in your own words. Solvyn clusters your report with similar community experiences and isolates actionable sub-problems.
        </p>
      </div>

      {result ? (
        /* AI Clustering Result Card */
        <div className="card-structured p-6 sm:p-7 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5 pb-4 border-b border-white/[0.08]">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
                  Cluster Status
                </span>
                {result.ai_matching?.confidence && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 text-rose-300 font-mono">
                    {Math.round(result.ai_matching.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                {result.ai_matching?.match_found
                  ? 'Attached to Existing Problem Cluster'
                  : 'New Problem Cluster Initialized'}
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {result.ai_matching?.reason ||
                  'Your experience has been parsed and integrated into the problem cluster.'}
              </p>
            </div>
          </div>

          {/* Problem Cluster Details */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border border-white/[0.08] bg-black/40">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Target Cluster
              </span>
              <h3 className="text-sm font-semibold text-white mt-1">
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
                  <strong className="text-slate-200 capitalize font-medium">
                    {result.problem.status}
                  </strong>
                </span>
              </div>
            </div>

            {/* Identified Sub-Problem */}
            {result.ai_matching?.sub_problem && (
              <div className="p-3.5 rounded-lg border border-rose-500/25 bg-rose-950/20">
                <span className="text-[11px] font-medium text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  Identified Root Sub-Problem
                </span>
                <p className="text-xs font-semibold text-white mt-1">
                  {result.ai_matching.sub_problem}
                </p>
              </div>
            )}

            {/* Original Report Preservation Confirmation */}
            <div className="p-3.5 rounded-lg border border-white/[0.05] bg-black/30">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Preserved Original Human Voice
              </span>
              <p className="text-xs text-slate-300 italic">
                &ldquo;{result.report.original_text}&rdquo;
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/problems/${result.problem.id}`}
              className="btn-primary w-full sm:w-auto flex-1 text-center justify-center"
            >
              <span>View Problem Cluster &amp; Solutions</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <button
              onClick={handleReset}
              className="btn-secondary w-full sm:w-auto"
            >
              Report Another Problem
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <form
          onSubmit={handleSubmit}
          className="card-structured p-6 sm:p-7 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Natural Language Text Area */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5"
            >
              What friction did you experience? <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I cannot track BMTC buses in real-time. Bus arrivals disappear from the app, causing long waits with zero accurate arrival estimates..."
              className="w-full px-3.5 py-3 rounded-lg border border-white/[0.12] bg-[#080B12] text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500/80 transition-all resize-y"
              required
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>Write naturally. Slang, shorthand, or raw notes are welcome.</span>
              <span className={description.length >= 15 ? 'text-rose-400 font-mono' : 'text-slate-500 font-mono'}>
                {description.length} chars (min 15)
              </span>
            </div>
          </div>

          {/* Category & Location Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                Category (Optional)
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#080B12] text-white text-xs focus:outline-none focus:border-rose-500/80"
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
                className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Location / City (Optional)
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka"
                className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-[#080B12] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500/80"
              >
              </input>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Classifying and clustering report...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
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
