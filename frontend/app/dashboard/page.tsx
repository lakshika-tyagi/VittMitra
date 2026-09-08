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
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '16px',
        }}
      >
        <AlertTriangle size={42} color="#dc2626" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
          Unable to Load Dashboard Intelligence
        </h2>
        <p style={{ color: '#b91c1c', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
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
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Profile ID #{profile?.id || '—'}
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#0f172a', margin: 0 }}>
            {profile ? `Namaste, ${profile.full_name}` : 'Welcome to VittMitra'}
          </h1>

          <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.35rem', margin: 0 }}>
            {business?.business_name ? (
              <span>
                <strong style={{ color: '#0f172a' }}>{business.business_name}</strong> •{' '}
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
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#64748b' }}>Profile Completeness</span>
                  <strong style={{ color: '#059669' }}>{profile.completeness.completion_percentage}%</strong>
                </div>
                <div style={{ width: '120px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${profile.completeness.completion_percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284c7 0%, #059669 100%)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
              <Link
                href="/onboarding"
                style={{
                  fontSize: '0.78rem',
                  color: '#2563eb',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderLeft: '1px solid #e2e8f0',
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
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <ShieldCheck size={18} color="#059669" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#047857', display: 'block' }}>Verified Govt Rules</strong>
            <span style={{ color: '#065f46' }}>Deterministic match engine</span>
          </div>
        </div>

        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <DollarSign size={18} color="#2563eb" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#1d4ed8', display: 'block' }}>Mathematical Amortization</strong>
            <span style={{ color: '#1e40af' }}>Formulaic subsidy & EMI</span>
          </div>
        </div>

        <div
          style={{
            background: '#f5f3ff',
            border: '1px solid #ddd6fe',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <MapPin size={18} color="#7c3aed" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#6d28d9', display: 'block' }}>PostGIS Spatial Feasibility</strong>
            <span style={{ color: '#5b21b6' }}>District & cluster intelligence</span>
          </div>
        </div>

        <div
          style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <Bot size={18} color="#9333ea" />
          <div style={{ fontSize: '0.78rem' }}>
            <strong style={{ color: '#7e22ce', display: 'block' }}>Grounded Decision Support</strong>
            <span style={{ color: '#6b21a8' }}>Gemini RAG plain-language AI</span>
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
              <Layers size={18} color="#0284c7" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Your Entrepreneurship Journey
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Current Stage: <strong style={{ color: '#2563eb' }}>{journey.current_stage_title}</strong>
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
                      ? '#eff6ff'
                      : isCompleted
                      ? '#f0fdf4'
                      : '#ffffff',
                    border: isCurrent
                      ? '1px solid #93c5fd'
                      : isCompleted
                      ? '1px solid #bbf7d0'
                      : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.85rem 0.65rem',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '100px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
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
                          ? '#dcfce7'
                          : '#f1f5f9',
                        color: isCurrent ? '#ffffff' : isCompleted ? '#059669' : '#64748b',
                      }}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    {isCurrent && (
                      <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: isCurrent ? 700 : 600,
                        color: isCurrent ? '#2563eb' : isCompleted ? '#0f172a' : '#64748b',
                        lineHeight: 1.25,
                        marginBottom: '0.2rem',
                      }}
                    >
                      {stage.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
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
            <Zap size={18} color="#d97706" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Recommended Next Best Actions
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
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
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        {action.badge_label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Priority #{action.priority}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                      {action.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, marginBottom: '1.25rem' }}>
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
          <TrendingUp size={18} color="#0284c7" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
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
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOP MATCH SCHEME</span>
              <Award size={18} color="#0284c7" />
            </div>
            {topSchemes.length > 0 ? (
              <>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', marginBottom: '0.2rem' }}>
                  {topSchemes[0].match_score}/100
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  {topSchemes[0].scheme_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {topSchemes[0].nodal_ministry} • <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>{topSchemes[0].match_category}</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Complete onboarding to view scheme matches.
              </div>
            )}
          </div>

          {/* Card 2: Location Feasibility */}
          <div className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>LOCATION FEASIBILITY</span>
              <MapPin size={18} color="#059669" />
            </div>
            {feasibility ? (
              <>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: feasibility.status === 'FAVOURABLE' ? '#059669' : feasibility.status === 'CAUTION' ? '#d97706' : '#dc2626',
                    marginBottom: '0.2rem',
                  }}
                >
                  {feasibility.status_label}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  {feasibility.district ? `${feasibility.district}, ${feasibility.state || ''}` : 'Location Analyzed'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {feasibility.positive_signals_count} Positive • {feasibility.caution_signals_count} Caution • {feasibility.nearby_clusters_count} MSME Clusters
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Location intelligence pending profile district.
              </div>
            )}
          </div>

          {/* Card 3: Financial Structure */}
          <div className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>FINANCIAL STRUCTURING</span>
              <DollarSign size={18} color="#d97706" />
            </div>
            {financial ? (
              <>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginBottom: '0.2rem' }}>
                  {formatINR(financial.project_cost)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                  Own Equity: <strong>{formatINR(financial.own_contribution_amount)}</strong> ({financial.own_contribution_percentage}%)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Est. EMI: <strong>{formatINR(financial.estimated_monthly_emi)}/mo</strong> @ {financial.interest_rate_applied}%
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Set project cost in profile to calculate loan & subsidy.
              </div>
            )}
          </div>

          {/* Card 4: Active Application Tracking */}
          <div className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>APPLICATION TRACKING</span>
              <FileText size={18} color="#7c3aed" />
            </div>
            {activeApps.length > 0 ? (
              <>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c3aed', marginBottom: '0.2rem' }}>
                  {activeApps[0].status_display}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                  {activeApps[0].scheme_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Ref: {activeApps[0].application_reference_number || 'Pending Ref'} • User-Recorded
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  No Active Submissions
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
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
            <Compass size={18} color="#0284c7" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Recommended Schemes For You
            </h2>
          </div>
          <Link
            href="/schemes"
            style={{
              fontSize: '0.85rem',
              color: '#2563eb',
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
                border: scheme.rank === 1 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                boxShadow: scheme.rank === 1 ? '0 4px 20px -2px rgba(37, 99, 235, 0.15)' : 'none',
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
                        backgroundColor: scheme.rank === 1 ? '#2563eb' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: scheme.rank === 1 ? '#ffffff' : '#475569',
                      }}
                    >
                      #{scheme.rank}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                      {scheme.match_category}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
                      {scheme.match_score}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/100</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  {scheme.scheme_name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  {scheme.nodal_ministry}
                </div>

                {scheme.primary_reason && (
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.8rem',
                      color: '#334155',
                      lineHeight: 1.4,
                      marginBottom: '1rem',
                      borderLeft: '3px solid #2563eb',
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
                    background: '#f1f5f9',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Max Loan</span>
                    <strong style={{ color: '#0f172a' }}>{scheme.max_loan_display || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Subsidy Assistance</span>
                    <strong style={{ color: '#059669' }}>{scheme.subsidy_display || 'N/A'}</strong>
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
        <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid #e9d5ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Sparkles size={20} color="#7c3aed" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              VittMitra AI Copilot (Grounded Decision Support)
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
              Google Gemini Powered
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '750px', lineHeight: 1.5, marginBottom: '1.25rem' }}>
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#0f172a',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <ShieldCheck size={16} color="#059669" />
                <strong style={{ fontSize: '0.85rem' }}>Explain My Eligibility</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Why did I match or fail specific scheme rules?
              </div>
            </button>

            <button
              onClick={() => handleTriggerAI('feasibility')}
              disabled={aiLoading}
              type="button"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#0f172a',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <MapPin size={16} color="#7c3aed" />
                <strong style={{ fontSize: '0.85rem' }}>Analyze Location Feasibility</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                What are the industrial risks in my district?
              </div>
            </button>

            <button
              onClick={() => handleTriggerAI('finance')}
              disabled={aiLoading}
              type="button"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#0f172a',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <DollarSign size={16} color="#d97706" />
                <strong style={{ fontSize: '0.85rem' }}>Explain Loan & Subsidy EMI</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                How is my margin money & amortization calculated?
              </div>
            </button>

            <button
              onClick={() => openCopilotChat('What documents do I need to prepare before visiting a bank or CSC partner?')}
              type="button"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#0f172a',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Bot size={16} color="#7c3aed" />
                <strong style={{ fontSize: '0.85rem' }}>Ask Custom Question</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Open interactive multilingual grounded assistant →
              </div>
            </button>
          </div>

          {/* AI Loading indicator */}
          {aiLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem', color: '#7c3aed', fontSize: '0.88rem' }}>
              <Loader2 size={18} className="pulse-dot" />
              <span>Synthesizing grounded explanation from verified government gazettes and profile state...</span>
            </div>
          )}

          {/* AI Error message */}
          {aiError && (
            <div style={{ padding: '0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginTop: '1rem' }}>
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
