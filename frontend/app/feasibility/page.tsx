'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  User,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Compass,
  ShieldCheck,
  Sparkles,
  Bot,
  Loader2,
} from 'lucide-react';
import {
  getUnifiedProfile,
  listProfiles,
  getProfileFeasibility,
  fetchLocationIntelligence,
  fetchNearbyClusters,
  explainFeasibilityAI,
} from '@/services/api';
import {
  UnifiedProfileResponse,
  FeasibilityAnalysisResponse,
  DistrictEcosystem,
  NearbyCluster,
  Entrepreneur,
  GroundedChatResponse,
} from '@/types';
import {
  FeasibilitySummaryCard,
  SignalsList,
  RiskCautionSection,
  LocationIntelligenceCard,
  MissingInfoPrompt,
} from '@/components/feasibility';
import { AIExplanationCard, GroundedChatDrawer } from '@/components/ai';

function FeasibilityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileIdQuery = searchParams.get('profile_id');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Profile State
  const [availableProfiles, setAvailableProfiles] = useState<Entrepreneur[]>([]);
  const [activeProfile, setActiveProfile] = useState<UnifiedProfileResponse | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  // Feasibility Data State
  const [feasibilityData, setFeasibilityData] = useState<FeasibilityAnalysisResponse | null>(null);
  const [districtEcosystem, setDistrictEcosystem] = useState<DistrictEcosystem | null>(null);
  const [nearbyClusters, setNearbyClusters] = useState<NearbyCluster[]>([]);

  // Step 11: Grounded AI State
  const [aiExplanation, setAiExplanation] = useState<GroundedChatResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const handleExplainFeasibility = async () => {
    if (!activeProfileId) return;
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await explainFeasibilityAI(String(activeProfileId));
      setAiExplanation(res);
    } catch (err: any) {
      setAiError(err.message || 'AI feasibility explanation failed.');
    } finally {
      setAiLoading(false);
    }
  };


  // Load profiles on mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        const profiles = await listProfiles();
        setAvailableProfiles(profiles);

        let targetId: number | null = null;
        if (profileIdQuery && !isNaN(Number(profileIdQuery))) {
          targetId = Number(profileIdQuery);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('vittmitra_active_profile_id');
          if (stored && !isNaN(Number(stored))) {
            targetId = Number(stored);
          } else if (profiles.length > 0) {
            targetId = profiles[0].id;
          }
        }

        if (targetId) {
          await loadProfileFeasibility(targetId);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to initialize feasibility:', err);
        setError(err.message || 'Failed to load profiles');
        setLoading(false);
      }
    }

    init();
  }, [profileIdQuery]);

  async function loadProfileFeasibility(profileId: number) {
    try {
      setLoading(true);
      setError(null);
      setActiveProfileId(profileId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vittmitra_active_profile_id', profileId.toString());
      }

      // Fetch unified profile
      const prof = await getUnifiedProfile(profileId);
      setActiveProfile(prof);

      // Fetch feasibility analysis
      const feas = await getProfileFeasibility(profileId);
      setFeasibilityData(feas);

      // Fetch location intelligence if district/state present
      const district = prof.entrepreneur?.district;
      const state = prof.entrepreneur?.state;
      const sector = prof.business_profiles?.[0]?.sector || undefined;

      if (district && state) {
        try {
          const eco = await fetchLocationIntelligence(district, state);
          setDistrictEcosystem(eco);
        } catch {
          setDistrictEcosystem(null);
        }

        try {
          const clusters = await fetchNearbyClusters(district, state, sector);
          setNearbyClusters(clusters);
        } catch {
          setNearbyClusters([]);
        }
      } else {
        setDistrictEcosystem(null);
        setNearbyClusters([]);
      }
    } catch (err: any) {
      console.error('Failed to load profile feasibility:', err);
      setError(err.message || `Failed to evaluate feasibility for profile ID ${profileId}`);
    } finally {
      setLoading(false);
    }
  }

  const handleProfileSwitch = (newId: number) => {
    router.push(`/feasibility?profile_id=${newId}`);
    loadProfileFeasibility(newId);
  };

  const overallOutcome = feasibilityData?.overall_outcome || feasibilityData?.overall_status || 'INSUFFICIENT_DATA';
  const positiveDrivers = feasibilityData?.positive_drivers || feasibilityData?.positive_signals || [];
  const riskFlags = feasibilityData?.risk_flags || feasibilityData?.risk_signals || [];
  const missingFields = feasibilityData?.missing_fields || feasibilityData?.missing_information || [];
  const recommendations = feasibilityData?.actionable_recommendations || feasibilityData?.recommendations || [];
  const disclaimer = feasibilityData?.regulatory_disclaimer || feasibilityData?.disclaimer || '';
  const context = feasibilityData?.context || feasibilityData?.profile_summary || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={activeProfileId ? `/schemes?profile_id=${activeProfileId}` : '/schemes'}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all"
              title="Back to Schemes"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                Business & Location Feasibility
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Deterministic MSME ecosystem signals, PostGIS spatial clusters & risk discovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile Dropdown Selector */}
            {availableProfiles.length > 0 && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400 hidden sm:block" />
                <select
                  value={activeProfileId || ''}
                  onChange={(e) => handleProfileSwitch(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  {availableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.district || 'Unassigned'}, {p.state || 'IN'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeProfileId && (
              <Link
                href={`/onboarding?edit=true&profile_id=${activeProfileId}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all hidden md:flex items-center gap-1.5"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Evaluating deterministic MSME signals & spatial proximity...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-rose-200">Unable to Evaluate Feasibility</h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto">{error}</p>
            <div className="pt-2">
              <Link
                href="/onboarding"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all inline-block"
              >
                Create / Complete Profile
              </Link>
            </div>
          </div>
        )}

        {/* Feasibility Analysis View */}
        {!loading && !error && feasibilityData && (
          <div className="space-y-8">
            {/* 1. Hero Summary Card */}
            <FeasibilitySummaryCard
              outcome={overallOutcome}
              headline={feasibilityData.headline}
              summaryNotes={feasibilityData.summary_notes}
              context={context}
              disclaimer={disclaimer}
              profileId={activeProfileId || undefined}
            />

            {/* 1.5 Grounded AI Feasibility Explanation Panel */}
            <div className="p-6 rounded-2xl border border-indigo-500/20 bg-linear-to-br from-indigo-950/30 via-slate-900/40 to-slate-950/60 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Grounded AI Feasibility Synthesis</h3>
                    <p className="text-[11px] text-slate-400">Natural-language interpretation grounded in your location MSME density and financial equity</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExplainFeasibility}
                    disabled={aiLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Explain Feasibility with AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ask Question</span>
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
                  {aiError}
                </div>
              )}

              {aiExplanation && (
                <AIExplanationCard
                  explanation={aiExplanation}
                  title="Grounded AI Feasibility Interpretation"
                  className="bg-slate-900/90 border-slate-800 text-slate-200"
                />
              )}
            </div>

            {/* 2. Missing Profile Information Notice (if any) */}
            {missingFields.length > 0 && (
              <MissingInfoPrompt
                missingFields={missingFields}
                profileId={activeProfileId || undefined}
              />
            )}


            {/* 3. Structured 4-Quadrant Drivers, Risks & Actions */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Feasibility Analysis & Risk Assessment
              </h3>
              <RiskCautionSection
                positiveDrivers={positiveDrivers}
                riskFlags={riskFlags}
                missingFields={missingFields}
                actionableRecommendations={recommendations}
                profileId={activeProfileId || undefined}
              />
            </section>

            {/* 4. Geographic MSME Ecosystem & Spatial PostGIS Data */}
            <LocationIntelligenceCard
              districtEcosystem={districtEcosystem}
              nearbyClusters={nearbyClusters}
            />

            {/* 5. Detailed Grounded Signals List */}
            <SignalsList signals={feasibilityData.signals} />
          </div>
        )}

        {/* Empty State: No profiles exist */}
        {!loading && !error && !feasibilityData && (
          <div className="py-20 text-center space-y-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8">
            <Compass className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">No Active Entrepreneur Profile Selected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please complete onboarding or select an existing entrepreneur profile to compute grounded
              feasibility signals, local industrial density, and nearest MSME clusters.
            </p>
            <div className="pt-2">
              <Link
                href="/onboarding"
                className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                Start Onboarding
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FeasibilityPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading Feasibility Intelligence...</p>
          </div>
        </div>
      }
    >
      <FeasibilityContent />
    </React.Suspense>
  );
}
