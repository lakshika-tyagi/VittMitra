'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  fetchSchemeDetail,
  fetchApplicationAssistance,
  createApplication,
  listProfiles,
} from '@/services/api';
import {
  SchemeDetailResponse,
  ApplicationAssistance,
  ApplicationCreatePayload,
} from '@/types';
import { ApplicationAssistanceView } from '@/components/applications';

export default function SchemeAccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const schemeIdParam = params.scheme_id as string;
  const profileIdQuery = searchParams.get('profile_id');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scheme, setScheme] = useState<SchemeDetailResponse | null>(null);
  const [assistance, setAssistance] = useState<ApplicationAssistance | null>(null);
  const [entrepreneurId, setEntrepreneurId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Scheme Detail
        const schemeData = await fetchSchemeDetail(schemeIdParam);
        setScheme(schemeData);

        // 2. Determine Profile ID
        let profileId: number | null = null;
        if (profileIdQuery && !isNaN(Number(profileIdQuery))) {
          profileId = Number(profileIdQuery);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('vittmitra_active_profile_id');
          if (stored && !isNaN(Number(stored))) {
            profileId = Number(stored);
          }
        }

        // Fallback to first profile if not found
        if (!profileId) {
          const profiles = await listProfiles();
          if (profiles.length > 0) {
            profileId = profiles[0].id;
          }
        }

        if (!profileId) {
          setError('No active entrepreneur profile found. Please create or select a profile first.');
          return;
        }

        setEntrepreneurId(profileId);

        // 3. Fetch Application Assistance Package
        const assistData = await fetchApplicationAssistance(profileId, schemeData.id);
        setAssistance(assistData);
      } catch (err: any) {
        console.error('Failed to load application assistance data:', err);
        setError(err.message || 'Application assistance guidance could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [schemeIdParam, profileIdQuery]);

  const handleApplicationCreated = (appId: number) => {
    // Navigate to tracker after 1.5s
    setTimeout(() => {
      router.push('/applications');
    }, 1500);
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-6 text-center">
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-slate-100">
            Synthesizing Application Guidance Package...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Retrieving scheme eligibility rules, required document checklists, and nearest verified channel partners.
          </p>
        </div>
      </main>
    );
  }

  if (error || !scheme || !assistance || !entrepreneurId) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="p-8 rounded-2xl border border-rose-900/40 bg-rose-950/20 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-100">
            Unable to Load Application Assistance
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            {error || 'The requested scheme assistance package is currently unavailable.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/schemes/${schemeIdParam}`}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Scheme Details
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-200">Dashboard</Link>
        <span>/</span>
        <Link href="/schemes" className="hover:text-slate-200">Schemes</Link>
        <span>/</span>
        <Link href={`/schemes/${scheme.id || scheme.scheme_code}`} className="hover:text-slate-200">
          {scheme.scheme_code}
        </Link>
        <span>/</span>
        <span className="text-emerald-400 font-medium">Access & Channel Partners</span>
      </div>

      {/* Main Guidance View */}
      <ApplicationAssistanceView
        assistance={assistance}
        entrepreneurId={entrepreneurId}
        onCreateApplication={createApplication}
        onApplicationCreated={handleApplicationCreated}
      />
    </main>
  );
}
