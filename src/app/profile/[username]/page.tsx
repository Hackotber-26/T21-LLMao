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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </Link>

      {/* Header Profile Card */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#0C1019]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/50 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 p-[2px] shadow-lg shadow-rose-500/20 shrink-0">
            <div className="w-full h-full bg-[#080B12] rounded-[14px] flex items-center justify-center">
              <User className="w-10 h-10 text-rose-300" />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-sm text-rose-400 font-medium mb-3">@{profile.username}</p>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed mb-4">
              {profile.bio || 'Active contributor and problem solver on Solvyn.'}
            </p>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-2">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Badges */}
          <div className="flex sm:flex-col gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-center">
              <span className="block text-xl font-bold text-white">
                {profile.problem_count || 1}
              </span>
              <span className="text-[11px] text-rose-300">Reported</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl border border-pink-500/20 bg-pink-950/20 text-center">
              <span className="block text-xl font-bold text-white">
                {profile.solution_count || 1}
              </span>
              <span className="text-[11px] text-pink-300">Solutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions Tabs / Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-rose-400" />
          Submitted Solutions
        </h2>

        <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0C1019]/80 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                Transportation
              </span>
              <h3 className="text-base font-bold text-white mt-2">
                Solvyn Transit: Real-Time Open GTFS Route Visualizer
              </h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                A lightweight Progressive Web App using open transit GTFS-RT telemetry with
                crowd-sourced verification and ETA predictions.
              </p>
            </div>
            <Link
              href="/problems/e7b0d778-9e5c-44bf-a548-c96fa049b1a2"
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              View Problem <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
