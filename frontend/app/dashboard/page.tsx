'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Compass,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Bot,
  RefreshCw,
  Layers,
  ChevronRight,
  Building2,
  UserCheck,
  ExternalLink,
  Award,
  CircleDot,
  Loader2,
  Info,
  Calendar,
  Zap,
} from 'lucide-react';
import { fetchDashboard, explainEligibilityAI, explainFeasibilityAI, explainFinanceAI } from '@/services/api';
import { DashboardResponse, GroundedChatResponse } from '@/types';
import { useProfile } from '@/hooks/useProfile';
import { AIExplanationCard, GroundedChatDrawer } from '@/components/ai';

export default function DashboardPage() {
  const router = useRouter();
  const { activeProfileId, availableProfiles, setActiveProfileId, loading: profileContextLoading } = useProfile();

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Grounded AI state
  const [aiExplanation, setAiExplanation] = useState<GroundedChatResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);
  const [initialAiMessage, setInitialAiMessage] = useState<string>('');

  const loadDashboardData = useCallback(async (profId?: number | null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboard(profId);
      setDashboard(data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to aggregate dashboard intelligence.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profileContextLoading) {
      loadDashboardData(activeProfileId);
    }
  }, [activeProfileId, profileContextLoading, loadDashboardData]);

  // AI Quick Actions
  const handleTriggerAI = async (type: 'eligibility' | 'feasibility' | 'finance' | 'general', schemeCode?: string) => {
    if (!activeProfileId) return;
    try {
      setAiLoading(true);
      setAiError(null);
      let response: GroundedChatResponse | null = null;

      const targetCode = schemeCode || dashboard?.recommended_schemes[0]?.scheme_code || 'PMEGP';

      if (type === 'eligibility') {
        response = await explainEligibilityAI(String(activeProfileId), targetCode);
      } else if (type === 'feasibility') {
        response = await explainFeasibilityAI(String(activeProfileId));
      } else if (type === 'finance') {
        response = await explainFinanceAI(String(activeProfileId), targetCode);
      }

      if (response) {
        setAiExplanation(response);
      }
    } catch (err: any) {
      console.error('AI quick explanation failed:', err);
      setAiError(err.message || 'Grounded AI explanation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const openCopilotChat = (prompt: string) => {
    setInitialAiMessage(prompt);
    setAiDrawerOpen(true);
  };

  // Helper for formatting currency in Indian numbering (INR Lakhs / Thousands)
  const formatINR = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading && !dashboard) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
        }}
      >
        <Loader2 size={36} color="#38bdf8" className="pulse-dot" />
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Aggregating personalized scheme matches, location feasibility & financial intelligence...
        </p>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '4rem auto',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '16px',
        }}
      >
        <AlertTriangle size={42} color="#f87171" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Unable to Load Dashboard Intelligence
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {error}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadDashboardData(activeProfileId)}
            className="btn-primary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} /> Try Again
          </button>
          <Link
            href="/onboarding"
            className="btn-secondary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          >
            Create / Edit Profile
          </Link>
        </div>
      </div>
    );
  }

  const profile = dashboard?.profile;
  const business = dashboard?.business;
  const financial = dashboard?.financial;
  const feasibility = dashboard?.feasibility;
  const journey = dashboard?.progress_journey;
  const nextActions = dashboard?.next_actions || [];
  const topSchemes = dashboard?.recommended_schemes || [];
  const activeApps = dashboard?.active_applications || [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      {/* 1. Header & Welcome Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              <CircleDot size={10} /> Active Session
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Profile ID #{profile?.id || '—'}
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#f8fafc', margin: 0 }}>
            {profile ? `Namaste, ${profile.full_name}` : 'Welcome to VittMitra'}
          </h1>

          <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '0.35rem', margin: 0 }}>
            {business?.business_name ? (
              <span>
                <strong>{business.business_name}</strong> •{' '}
                <span style={{ textTransform: 'capitalize' }}>{business.sector?.replace('_', ' ')}</span> •{' '}
                {business.location_label || `${profile?.district}, ${profile?.state}`}
              </span>
            ) : (
              'Empowering inclusive entrepreneurship through explainable government schemes.'
            )}
          </p>
        </div>

        {/* Profile Completeness & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {profile && (
            <div
              style={{
                background: 'rgba(17, 24, 39, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#94a3b8' }}>Profile Completeness</span>
                  <strong style={{ color: '#34d399' }}>{profile.completeness.completion_percentage}%</strong>
                </div>
                <div style={{ width: '120px', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${profile.completeness.completion_percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
              <Link
                href="/onboarding"
                style={{
                  fontSize: '0.78rem',
                  color: '#38bdf8',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingLeft: '0.75rem',
                }}
              >
                Edit
              </Link>
            </div>
          )}

          <button
            onClick={() => loadDashboardData(activeProfileId)}
            type="button"
            title="Refresh Dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 2. System Trust & Provenance Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <ShieldCheck size={18} color="#34d399" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#34d399', display: 'block' }}>Verified Govt Rules</strong>
            <span style={{ color: '#94a3b8' }}>Deterministic match engine</span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <DollarSign size={18} color="#38bdf8" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#38bdf8', display: 'block' }}>Mathematical Amortization</strong>
            <span style={{ color: '#94a3b8' }}>Formulaic subsidy & EMI</span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(129, 140, 248, 0.06)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <MapPin size={18} color="#818cf8" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#818cf8', display: 'block' }}>PostGIS Spatial Feasibility</strong>
            <span style={{ color: '#94a3b8' }}>District & cluster intelligence</span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(192, 132, 252, 0.06)',
            border: '1px solid rgba(192, 132, 252, 0.2)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <Bot size={18} color="#c084fc" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#c084fc', display: 'block' }}>Grounded Decision Support</strong>
            <span style={{ color: '#94a3b8' }}>Gemini RAG plain-language AI</span>
          </div>
        </div>
      </div>

      {/* 3. Progress Journey Map */}
      {journey && (
        <section
          className="glass-panel"
          style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={18} color="#38bdf8" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Your Entrepreneurship Journey
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Current Stage: <strong style={{ color: '#38bdf8' }}>{journey.current_stage_title}</strong>
              </span>
              <span className="badge badge-blue" style={{ fontSize: '0.78rem' }}>
                {Math.round(journey.completion_percentage)}% Overall Progress
              </span>
            </div>
          </div>

          {/* Journey Steps Horizontal Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {journey.stages.map((stage, idx) => {
              const isCompleted = stage.is_completed;
              const isCurrent = stage.is_current;
              return (
                <Link
                  key={stage.stage_id}
                  href={stage.target_url}
                  style={{
                    backgroundColor: isCurrent
                      ? 'rgba(56, 189, 248, 0.12)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isCurrent
                      ? '1px solid rgba(56, 189, 248, 0.4)'
                      : isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.25)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '0.85rem 0.65rem',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '100px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: isCurrent
                          ? '#2563eb'
                          : isCompleted
                          ? 'rgba(16, 185, 129, 0.25)'
                          : 'rgba(255, 255, 255, 0.06)',
                        color: isCurrent ? '#ffffff' : isCompleted ? '#34d399' : '#64748b',
                      }}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    {isCurrent && (
                      <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: isCurrent ? 700 : 600,
                        color: isCurrent ? '#38bdf8' : isCompleted ? '#e2e8f0' : '#64748b',
                        lineHeight: 1.25,
                        marginBottom: '0.2rem',
                      }}
                    >
                      {stage.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {isCurrent ? 'In Progress →' : isCompleted ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Deterministic Next Best Actions */}
      {nextActions.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Zap size={18} color="#fbbf24" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Recommended Next Best Actions
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              (Deterministic & State-Aware)
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {nextActions.map((action) => {
              const badgeClass =
                action.badge_type === 'emerald'
                  ? 'badge-emerald'
                  : action.badge_type === 'amber'
                  ? 'badge-amber'
                  : action.badge_type === 'purple'
                  ? 'badge-purple'
                  : 'badge-blue';

              return (
                <div
                  key={action.action_id}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        {action.badge_label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        Priority #{action.priority}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      {action.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                      {action.description}
                    </p>
                  </div>

                  <Link
                    href={action.target_url}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      fontSize: '0.85rem',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{action.cta_label}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Key Metrics Snapshot (4 Cards Grid) */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <TrendingUp size={18} color="#38bdf8" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Executive Snapshot
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Card 1: Top Scheme Match */}
          <div className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TOP MATCH SCHEME</span>
              <Award size={18} color="#38bdf8" />
            </div>
            {topSchemes.length > 0 ? (
              <>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.2rem' }}>
                  {topSchemes[0].match_score}/100
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                  {topSchemes[0].scheme_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {topSchemes[0].nodal_ministry} • <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>{topSchemes[0].match_category}</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Complete onboarding to view scheme matches.
              </div>
            )}
          </div>

          {/* Card 2: Location Feasibility */}
          <div className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>LOCATION FEASIBILITY</span>
              <MapPin size={18} color="#34d399" />
            </div>
            {feasibility ? (
              <>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: feasibility.status === 'FAVOURABLE' ? '#34d399' : feasibility.status === 'CAUTION' ? '#fbbf24' : '#f87171',
                    marginBottom: '0.2rem',
                  }}
                >
                  {feasibility.status_label}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.35rem' }}>
                  {feasibility.district ? `${feasibility.district}, ${feasibility.state || ''}` : 'Location Analyzed'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {feasibility.positive_signals_count} Positive • {feasibility.caution_signals_count} Caution • {feasibility.nearby_clusters_count} MSME Clusters
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Location intelligence pending profile district.
              </div>
            )}
          </div>

          {/* Card 3: Financial Structure */}
          <div className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>FINANCIAL STRUCTURING</span>
              <DollarSign size={18} color="#fbbf24" />
            </div>
            {financial ? (
              <>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.2rem' }}>
                  {formatINR(financial.project_cost)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#f8fafc', marginBottom: '0.25rem' }}>
                  Own Equity: <strong>{formatINR(financial.own_contribution_amount)}</strong> ({financial.own_contribution_percentage}%)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Est. EMI: <strong>{formatINR(financial.estimated_monthly_emi)}/mo</strong> @ {financial.interest_rate_applied}%
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Set project cost in profile to calculate loan & subsidy.
              </div>
            )}
          </div>

          {/* Card 4: Active Application Tracking */}
          <div className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>APPLICATION TRACKING</span>
              <FileText size={18} color="#c084fc" />
            </div>
            {activeApps.length > 0 ? (
              <>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c084fc', marginBottom: '0.2rem' }}>
                  {activeApps[0].status_display}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>
                  {activeApps[0].scheme_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Ref: {activeApps[0].application_reference_number || 'Pending Ref'} • User-Recorded
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>
                  No Active Submissions
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                  Ready to apply for your top matched scheme.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Top Recommended Schemes Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Compass size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Recommended Schemes For You
            </h2>
          </div>
          <Link
            href="/schemes"
            style={{
              fontSize: '0.85rem',
              color: '#38bdf8',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Explore All Matched Schemes</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {topSchemes.slice(0, 3).map((scheme) => (
            <div
              key={scheme.scheme_id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: scheme.rank === 1 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: scheme.rank === 1 ? '0 8px 24px -6px rgba(37, 99, 235, 0.3)' : 'none',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: scheme.rank === 1 ? '#2563eb' : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      #{scheme.rank}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                      {scheme.match_category}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                      {scheme.match_score}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/100</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                  {scheme.scheme_name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  {scheme.nodal_ministry}
                </div>

                {scheme.primary_reason && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.8rem',
                      color: '#cbd5e1',
                      lineHeight: 1.4,
                      marginBottom: '1rem',
                      borderLeft: '3px solid #38bdf8',
                    }}
                  >
                    {scheme.primary_reason}
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    fontSize: '0.78rem',
                    marginBottom: '1.25rem',
                    padding: '0.65rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Max Loan</span>
                    <strong style={{ color: '#f8fafc' }}>{scheme.max_loan_display || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Subsidy Assistance</span>
                    <strong style={{ color: '#34d399' }}>{scheme.subsidy_display || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <Link
                  href={`/schemes/${scheme.scheme_id}`}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}
                >
                  Match Details
                </Link>
                <Link
                  href={`/schemes/${scheme.scheme_id}/access`}
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}
                >
                  Apply via Partner →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Grounded AI Decision Support Copilot Quick Prompts */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Sparkles size={20} color="#c084fc" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              VittMitra AI Copilot (Grounded Decision Support)
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
              Google Gemini Powered
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '750px', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Ask plain-language questions grounded strictly in official government scheme guidelines, verified feasibility signals, and your financial profile.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <button
              onClick={() => handleTriggerAI('eligibility')}
              disabled={aiLoading}
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <ShieldCheck size={16} color="#34d399" />
                <strong style={{ fontSize: '0.85rem' }}>Explain My Eligibility</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Why did I match or fail specific scheme rules?
              </div>
            </button>

            <button
              onClick={() => handleTriggerAI('feasibility')}
              disabled={aiLoading}
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <MapPin size={16} color="#818cf8" />
                <strong style={{ fontSize: '0.85rem' }}>Analyze Location Feasibility</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                What are the industrial risks in my district?
              </div>
            </button>

            <button
              onClick={() => handleTriggerAI('finance')}
              disabled={aiLoading}
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <DollarSign size={16} color="#fbbf24" />
                <strong style={{ fontSize: '0.85rem' }}>Explain Loan & Subsidy EMI</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                How is my margin money & amortization calculated?
              </div>
            </button>

            <button
              onClick={() => openCopilotChat('What documents do I need to prepare before visiting a bank or CSC partner?')}
              type="button"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Bot size={16} color="#c084fc" />
                <strong style={{ fontSize: '0.85rem' }}>Ask Custom Question</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Open interactive multilingual grounded assistant →
              </div>
            </button>
          </div>

          {/* AI Loading indicator */}
          {aiLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem', color: '#c084fc', fontSize: '0.88rem' }}>
              <Loader2 size={18} className="pulse-dot" />
              <span>Synthesizing grounded explanation from verified government gazettes and profile state...</span>
            </div>
          )}

          {/* AI Error message */}
          {aiError && (
            <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginTop: '1rem' }}>
              {aiError}
            </div>
          )}

          {/* Display Grounded AI Explanation Result */}
          {aiExplanation && !aiLoading && (
            <div style={{ marginTop: '1.25rem' }}>
              <AIExplanationCard
                explanation={aiExplanation}
                title="Grounded AI Intelligence Briefing"
                onAskFollowUp={(question: string) => openCopilotChat(question)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Global Grounded Chat Drawer */}
      <GroundedChatDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        activeProfileId={activeProfileId ? String(activeProfileId) : undefined}
        activeSchemeCode={topSchemes[0]?.scheme_code}
        initialQuery={initialAiMessage}
      />
    </div>
  );
}
