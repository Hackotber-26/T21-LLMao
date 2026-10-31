'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PublicProfileResponse } from '@/types/api.types';
import {
  User,
  Code2,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading builder profile...</p>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const params = useParams();
  const username = (params?.username as string) || 'alex_dev';

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getProfile(username);
        setProfile(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading builder profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
      </Link>

      {/* Header Profile Card */}
      <div className="card-structured p-6 sm:p-7 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-xl bg-[#080B12] border border-white/[0.1] flex items-center justify-center text-rose-400 shrink-0">
            <User className="w-8 h-8" />
          </div>

          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-0.5">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-xs text-rose-400 font-mono mb-2">@{profile.username}</p>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mb-3">
              {profile.bio || 'Active contributor and problem solver on Solvyn.'}
            </p>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#080B12] border border-white/[0.08] text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Badges */}
          <div className="flex sm:flex-col gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-lg border border-white/[0.08] bg-[#080B12] text-center min-w-[5rem]">
              <span className="block text-lg font-semibold text-white">
                {profile.problem_count || 1}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Reported</span>
            </div>
            <div className="px-3.5 py-2 rounded-lg border border-white/[0.08] bg-[#080B12] text-center min-w-[5rem]">
              <span className="block text-lg font-semibold text-white">
                {profile.solution_count || 1}
              </span>
              <span className="text-[10px] text-rose-400 uppercase tracking-wider">Solutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions Section */}
      <div className="space-y-3.5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-rose-400" />
          Submitted Solutions
        </h2>

        <div className="card-structured p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                Transportation
              </span>
              <h3 className="text-sm font-semibold text-white mt-2">
                Solvyn Transit: Real-Time Open GTFS Route Visualizer
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                A lightweight Progressive Web App using open transit GTFS-RT telemetry with
                crowd-sourced verification and ETA predictions.
              </p>
            </div>
            <Link
              href="/problems/e7b0d778-9e5c-44bf-a548-c96fa049b1a2"
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium shrink-0"
            >
              <span>View Problem</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
