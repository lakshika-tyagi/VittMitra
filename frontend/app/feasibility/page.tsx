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
import { useProfile } from '@/hooks/useProfile';

function FeasibilityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { activeProfileId, activeProfile, availableProfiles, setActiveProfileId, loading: profileLoading } = useProfile();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Feasibility Data State
  const [feasibilityData, setFeasibilityData] = useState<FeasibilityAnalysisResponse | null>(null);
  const [districtEcosystem, setDistrictEcosystem] = useState<DistrictEcosystem | null>(null);
  const [nearbyClusters, setNearbyClusters] = useState<NearbyCluster[]>([]);

  // Grounded AI State
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

  // Load feasibility whenever activeProfileId changes
  useEffect(() => {
    async function loadFeasibilityData() {
      if (!activeProfileId) {
        setFeasibilityData(null);
        setDistrictEcosystem(null);
        setNearbyClusters([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Fetch feasibility analysis
        const feas = await getProfileFeasibility(activeProfileId);
        setFeasibilityData(feas);

        // Fetch location intelligence if district/state present
        const district = activeProfile?.entrepreneur?.district;
        const state = activeProfile?.entrepreneur?.state;
        const sector = activeProfile?.business_profiles?.[0]?.sector || undefined;

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
        setError(err.message || `Failed to evaluate feasibility for profile ID ${activeProfileId}`);
      } finally {
        setLoading(false);
      }
    }

    if (!profileLoading) {
      loadFeasibilityData();
    }
  }, [activeProfileId, activeProfile, profileLoading]);

  const overallOutcome = feasibilityData?.overall_outcome || feasibilityData?.overall_status || 'INSUFFICIENT_DATA';
  const positiveDrivers = feasibilityData?.positive_drivers || feasibilityData?.positive_signals || [];
  const riskFlags = feasibilityData?.risk_flags || feasibilityData?.risk_signals || [];
  const missingFields = feasibilityData?.missing_fields || feasibilityData?.missing_information || [];
  const recommendations = feasibilityData?.actionable_recommendations || feasibilityData?.recommendations || [];
  const disclaimer = feasibilityData?.regulatory_disclaimer || feasibilityData?.disclaimer || '';
  const context = feasibilityData?.context || feasibilityData?.profile_summary || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pb-16">
      {/* In-page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Link
              href={activeProfileId ? `/schemes?profile_id=${activeProfileId}` : '/schemes'}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xs"
              title="Back to Schemes"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-600" />
                Business & Location Feasibility
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Deterministic MSME ecosystem signals, PostGIS spatial clusters & risk discovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeProfileId && (
              <Link
                href={`/onboarding?edit=true&profile_id=${activeProfileId}`}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all shadow-xs hidden md:flex items-center gap-1.5"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="py-24 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-600 font-medium">Evaluating deterministic MSME signals & spatial proximity...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Unable to Evaluate Feasibility</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto font-medium">{error}</p>
            <div className="pt-2">
              <Link
                href="/onboarding"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-all inline-block shadow-xs"
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
            <div className="p-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-white shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">Grounded AI Feasibility Synthesis</h3>
                    <p className="text-xs text-slate-500 font-medium">Natural-language interpretation grounded in your location MSME density and financial equity</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExplainFeasibility}
                    disabled={aiLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Explain Feasibility with AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all shadow-xs cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ask Question</span>
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {aiError}
                </div>
              )}

              {aiExplanation && (
                <AIExplanationCard
                  explanation={aiExplanation}
                  title="Grounded AI Feasibility Interpretation"
                  className="bg-white border-slate-200 text-slate-900 shadow-xs"
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
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
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
          <div className="py-20 text-center space-y-4 rounded-2xl border border-dashed border-slate-200 bg-white p-8 shadow-xs">
            <Compass className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Active Entrepreneur Profile Selected</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please complete onboarding or select an existing entrepreneur profile to compute grounded
              feasibility signals, local industrial density, and nearest MSME clusters.
            </p>
            <div className="pt-2">
              <Link
                href="/onboarding"
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all inline-flex items-center gap-2 shadow-sm"
              >
                Start Onboarding
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* AI Chat Drawer */}
      <GroundedChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeProfileId={activeProfileId ? String(activeProfileId) : null}
      />
    </div>
  );
}

export default function FeasibilityPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading Feasibility Intelligence...</p>
          </div>
        </div>
      }
    >
      <FeasibilityContent />
    </React.Suspense>
  );
}
