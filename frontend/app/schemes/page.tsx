'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  Filter,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  PlusCircle,
  Building2,
  Percent,
  Layers,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  SchemeCard,
  ComparisonDrawer,
} from '@/components/schemes';
import { useProfile } from '@/hooks/useProfile';
import { getProfileMatching } from '@/services/api';
import { SchemeMatchResult, MatchCategory, SchemeMatchingResponse } from '@/types';

function SchemesContent() {
  const {
    activeProfileId,
    activeProfile: profile,
    loading: profileLoading,
    availableProfiles,
    setActiveProfileId,
  } = useProfile();

  const [matchingData, setMatchingData] = useState<SchemeMatchingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [activeCategoryTab, setActiveCategoryTab] = useState<MatchCategory | 'ALL'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'SUBSIDY_DESC' | 'LOAN_DESC'>('SCORE_DESC');

  // Scheme Comparison Drawer State (2 to 4 Schemes)
  const [selectedForCompare, setSelectedForCompare] = useState<SchemeMatchResult[]>([]);

  useEffect(() => {
    async function loadMatching() {
      if (!activeProfileId) {
        setMatchingData(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await getProfileMatching(activeProfileId, 50, true);
        setMatchingData(data);
      } catch (err: any) {
        console.error('Failed to load scheme matching:', err);
        setError(err.message || 'Failed to evaluate government schemes.');
      } finally {
        setLoading(false);
      }
    }

    if (!profileLoading) {
      loadMatching();
    }
  }, [activeProfileId, profileLoading]);

  const handleProfileChange = (newProfileId: number) => {
    setActiveProfileId(newProfileId);
    setSelectedForCompare([]);
  };

  const handleToggleCompare = (scheme: SchemeMatchResult) => {
    const schemeId = scheme.scheme_id || scheme.id;
    setSelectedForCompare(prev => {
      const exists = prev.some(s => (s.scheme_id || s.id) === schemeId);
      if (exists) {
        return prev.filter(s => (s.scheme_id || s.id) !== schemeId);
      } else {
        if (prev.length >= 4) return prev;
        return [...prev, scheme];
      }
    });
  };

  const handleRemoveCompare = (schemeId: number) => {
    setSelectedForCompare(prev => prev.filter(s => (s.scheme_id || s.id) !== schemeId));
  };

  const handleClearCompare = () => {
    setSelectedForCompare([]);
  };

  // Filter & Sort Logic
  const filteredSchemes = useMemo(() => {
    const resultsList = matchingData?.results || matchingData?.matches || [];
    if (!resultsList || resultsList.length === 0) return [];

    let results = [...resultsList];

    // Category Tab Filter
    if (activeCategoryTab !== 'ALL') {
      results = results.filter(s => s.match_category === activeCategoryTab);
    }

    // Sector Filter
    if (selectedSector !== 'ALL') {
      results = results.filter(s => s.sectors?.some((sec: string) => sec.toLowerCase() === selectedSector.toLowerCase()));
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        s =>
          s.scheme_name.toLowerCase().includes(q) ||
          s.scheme_code.toLowerCase().includes(q) ||
          s.nodal_ministry?.toLowerCase().includes(q) ||
          s.short_description?.toLowerCase().includes(q)
      );
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'SCORE_DESC') {
        return b.match_score - a.match_score;
      }
      if (sortBy === 'SUBSIDY_DESC') {
        const subA = a.financial_benefits?.max_subsidy_pct || a.financial_summary?.max_subsidy_pct || 0;
        const subB = b.financial_benefits?.max_subsidy_pct || b.financial_summary?.max_subsidy_pct || 0;
        return subB - subA;
      }
      if (sortBy === 'LOAN_DESC') {
        const loanA = a.financial_benefits?.max_loan_amount || a.financial_summary?.max_loan_amount || 0;
        const loanB = b.financial_benefits?.max_loan_amount || b.financial_summary?.max_loan_amount || 0;
        return loanB - loanA;
      }
      return 0;
    });

    return results;
  }, [matchingData, activeCategoryTab, selectedSector, searchQuery, sortBy]);

  // Counts for tabs
  const allResults = matchingData?.results || matchingData?.matches || [];
  const countEligible = allResults.filter((m: SchemeMatchResult) => m.match_category === 'ELIGIBLE').length;
  const countPotential = allResults.filter((m: SchemeMatchResult) => m.match_category === 'POTENTIALLY_RELEVANT').length;
  const countNotEligible = allResults.filter((m: SchemeMatchResult) => m.match_category === 'NOT_ELIGIBLE').length;

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 8rem 1.5rem' }}>
      {/* Header & Navigation */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Link href="/" style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
              ← Dashboard
            </Link>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 700 }}>Schemes For You</span>
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#0f172a' }}>
            Personalized <span className="gradient-text">Government Scheme Matches</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0.35rem 0 0 0' }}>
            Deterministic rule evaluation & explainable ranking based on your profile inputs.
          </p>
        </div>

        {/* Profile Switcher / Create New */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {availableProfiles.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <User size={16} color="#2563eb" />
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Profile:</span>
              <select
                value={activeProfileId || ''}
                onChange={(e) => handleProfileChange(Number(e.target.value))}
                style={{
                  background: 'transparent',
                  color: '#0f172a',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {availableProfiles.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#ffffff', color: '#0f172a' }}>
                    {p.full_name} (#{p.id})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Link href="/onboarding" className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <PlusCircle size={15} />
            <span>New Profile</span>
          </Link>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <RefreshCw size={36} color="#2563eb" className="animate-spin" style={{ margin: '0 auto 1.25rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Evaluating Government Schemes...
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#475569', maxWidth: '450px', margin: '0 auto' }}>
            Running deterministic eligibility operators and multi-dimensional financial scoring for your profile.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: '#991b1b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <span>Error Evaluating Matches</span>
          </div>
          <p style={{ fontSize: '0.9rem', margin: 0, color: '#7f1d1d' }}>{error}</p>
        </div>
      )}

      {/* No Profile Warning / Empty State */}
      {!loading && !profile && !error && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
          <User size={48} color="#2563eb" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            No Entrepreneur Profile Found
          </h2>
          <p style={{ color: '#475569', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            To discover and match personalized government schemes with subsidy evaluations and deterministic eligibility breakdowns, please complete the structured entrepreneur onboarding form first.
          </p>
          <Link href="/onboarding" className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
            Start Entrepreneur Onboarding →
          </Link>
        </div>
      )}

      {/* Main Content when Profile & Matching Data is Loaded */}
      {!loading && profile && matchingData && (
        <>
          {/* Active Profile Summary Banner */}
          <section
            style={{
              padding: '1.25rem 1.75rem',
              marginBottom: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Applicant
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {profile.entrepreneur.full_name}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Demographics
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                  {profile.entrepreneur.gender}, {profile.entrepreneur.age} yrs • {profile.entrepreneur.category}
                </div>
              </div>

              {profile.business_profiles?.[0]?.sector && (
                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Sector & Enterprise
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                    {profile.business_profiles[0].sector.replace('_', ' ')} • {profile.business_profiles[0].business_stage?.replace('_', ' ')}
                  </div>
                </div>
              )}

              {profile.financial_profiles?.[0]?.project_cost && (
                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Project Cost
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#059669', fontWeight: 800 }}>
                    ₹{Number(profile.financial_profiles[0].project_cost).toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Location
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                  {profile.entrepreneur.district}, {profile.entrepreneur.state} ({profile.entrepreneur.area_type})
                </div>
              </div>
            </div>

            {/* Action CTAs & Completeness Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                href={`/feasibility?profile_id=${profile.entrepreneur.id}`}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#059669',
                  borderColor: '#a7f3d0',
                  backgroundColor: '#ecfdf5',
                }}
              >
                <Compass size={14} color="#059669" />
                <span>Location Feasibility</span>
              </Link>

              {/* Completeness Pill */}
              {(() => {
                const compPct = profile.completeness?.completion_percentage ?? profile.completeness?.overall_percentage ?? 100;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.75rem', borderLeft: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Profile Completeness</div>
                      <strong style={{ fontSize: '0.85rem', color: compPct === 100 ? '#059669' : '#d97706', fontWeight: 800 }}>
                        {compPct}%
                      </strong>
                    </div>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        border: `3px solid ${compPct === 100 ? '#059669' : '#d97706'}`,
                        backgroundColor: compPct === 100 ? '#ecfdf5' : '#fffbeb',
                        color: compPct === 100 ? '#065f46' : '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      {compPct}%
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Completeness Warning Banner (if incomplete) */}
          {(() => {
            const compPct = profile.completeness?.completion_percentage ?? profile.completeness?.overall_percentage ?? 100;
            const missingList = profile.completeness?.missing_fields ?? [];
            if (compPct >= 100) return null;
            return (
              <div
                style={{
                  padding: '0.875rem 1.25rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} color="#d97706" />
                  <span>
                    Profile is <strong>{compPct}% complete</strong>. Missing fields: {missingList.slice(0, 3).join(', ')}{missingList.length > 3 ? '...' : ''}. Completing them unlocks precise verification.
                  </span>
                </div>
                <Link href="/onboarding" style={{ color: '#2563eb', fontSize: '0.825rem', fontWeight: 700, textDecoration: 'none' }}>
                  Complete Profile →
                </Link>
              </div>
            );
          })()}

          {/* Filter, Search & Category Tabs Bar */}
          <section style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Category Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '2px solid #e2e8f0',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveCategoryTab('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'ALL' ? '3px solid #2563eb' : '3px solid transparent',
                  padding: '0.65rem 1rem',
                  color: activeCategoryTab === 'ALL' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>All Schemes</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: activeCategoryTab === 'ALL' ? '#eff6ff' : '#f1f5f9', color: activeCategoryTab === 'ALL' ? '#1d4ed8' : '#64748b', padding: '0.15rem 0.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                  {matchingData.total_schemes_evaluated}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('ELIGIBLE')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'ELIGIBLE' ? '3px solid #059669' : '3px solid transparent',
                  padding: '0.65rem 1rem',
                  color: activeCategoryTab === 'ELIGIBLE' ? '#065f46' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckCircle2 size={15} color={activeCategoryTab === 'ELIGIBLE' ? '#059669' : '#94a3b8'} />
                <span>Top Matches (Eligible)</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  {countEligible}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('POTENTIALLY_RELEVANT')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'POTENTIALLY_RELEVANT' ? '3px solid #d97706' : '3px solid transparent',
                  padding: '0.65rem 1rem',
                  color: activeCategoryTab === 'POTENTIALLY_RELEVANT' ? '#92400e' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <AlertTriangle size={15} color={activeCategoryTab === 'POTENTIALLY_RELEVANT' ? '#d97706' : '#94a3b8'} />
                <span>Needs Verification</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  {countPotential}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('NOT_ELIGIBLE')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'NOT_ELIGIBLE' ? '3px solid #dc2626' : '3px solid transparent',
                  padding: '0.65rem 1rem',
                  color: activeCategoryTab === 'NOT_ELIGIBLE' ? '#991b1b' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <XCircle size={15} color={activeCategoryTab === 'NOT_ELIGIBLE' ? '#dc2626' : '#94a3b8'} />
                <span>Not Currently Eligible</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  {countNotEligible}
                </span>
              </button>
            </div>

            {/* Controls: Search, Sector Filter, Sort */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {/* Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.5rem 0.85rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  flex: 1,
                  minWidth: '240px',
                  maxWidth: '380px',
                }}
              >
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search scheme name, ministry, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>

              {/* Filters & Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Sector Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <Filter size={14} color="#64748b" />
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    style={{
                      background: 'transparent',
                      color: '#0f172a',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL" style={{ background: '#ffffff', color: '#0f172a' }}>All Sectors</option>
                    <option value="manufacturing" style={{ background: '#ffffff', color: '#0f172a' }}>Manufacturing</option>
                    <option value="services" style={{ background: '#ffffff', color: '#0f172a' }}>Services</option>
                    <option value="trading" style={{ background: '#ffffff', color: '#0f172a' }}>Trading & Retail</option>
                    <option value="handicrafts" style={{ background: '#ffffff', color: '#0f172a' }}>Handicrafts & Artisans</option>
                    <option value="agro_allied" style={{ background: '#ffffff', color: '#0f172a' }}>Agro-Allied</option>
                    <option value="street_vendor" style={{ background: '#ffffff', color: '#0f172a' }}>Street Vending</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.5rem 0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <ArrowUpDown size={14} color="#64748b" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{
                      background: 'transparent',
                      color: '#0f172a',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="SCORE_DESC" style={{ background: '#ffffff', color: '#0f172a' }}>Highest Match Score</option>
                    <option value="SUBSIDY_DESC" style={{ background: '#ffffff', color: '#0f172a' }}>Highest Subsidy Rate (%)</option>
                    <option value="LOAN_DESC" style={{ background: '#ffffff', color: '#0f172a' }}>Highest Loan Cap (₹)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Scheme Cards Grid */}
          {filteredSchemes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
              <Layers size={36} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                No schemes found matching criteria
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                Try resetting search filters or switching categories.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              {filteredSchemes.map((scheme) => (
                <SchemeCard
                  key={scheme.scheme_id || scheme.id}
                  scheme={scheme}
                  profileId={activeProfileId}
                  isSelectedForCompare={selectedForCompare.some(s => (s.scheme_id || s.id) === (scheme.scheme_id || scheme.id))}
                  onToggleCompare={handleToggleCompare}
                  disableCompareSelect={selectedForCompare.length >= 4}
                />
              ))}
            </div>
          )}

          {/* Regulatory Non-Guarantee Disclaimer */}
          <section
            style={{
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.825rem',
              color: '#475569',
              lineHeight: 1.6,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#0f172a', fontWeight: 700 }}>Statutory & Advisory Notice: </strong>
              VittMitra provides deterministic scheme matching, subsidy estimation, and eligibility explainability based on published Government of India and State operational guidelines. Match scores and eligibility indications do not represent an official credit guarantee, sanction order, or approval from nodal ministries or participating financial institutions. All loan sanctions and subsidy disbursements remain subject to independent credit appraisal and verification by respective financing agencies.
            </div>
          </section>

          {/* Floating Comparison Drawer (2 to 4 Schemes) */}
          <ComparisonDrawer
            selectedSchemes={selectedForCompare}
            onRemove={handleRemoveCompare}
            onClear={handleClearCompare}
            profileId={activeProfileId}
          />
        </>
      )}
    </main>
  );
}

export default function SchemesPage() {
  return (
    <React.Suspense
      fallback={
        <main className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p>Loading Scheme Discovery Engine...</p>
        </main>
      }
    >
      <SchemesContent />
    </React.Suspense>
  );
}
