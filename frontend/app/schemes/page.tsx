'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  ArrowUpDown,
  Search,
  PlusCircle,
  ShieldCheck,
  RefreshCw,
  Layers,
  Compass,
} from 'lucide-react';
import {
  getProfileMatching,
  getUnifiedProfile,
  listProfiles,
} from '@/services/api';
import {
  SchemeMatchingResponse,
  SchemeMatchResult,
  UnifiedProfileResponse,
} from '@/types';
import SchemeCard from '@/components/schemes/SchemeCard';
import ComparisonDrawer from '@/components/schemes/ComparisonDrawer';

function SchemesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileIdQuery = searchParams.get('profile_id');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Profile State
  const [profile, setProfile] = useState<UnifiedProfileResponse | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  // Matching Engine Results
  const [matchingData, setMatchingData] = useState<SchemeMatchingResponse | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'ALL' | 'ELIGIBLE' | 'POTENTIALLY_RELEVANT' | 'NOT_ELIGIBLE'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'SUBSIDY_DESC' | 'LOAN_DESC'>('SCORE_DESC');

  // Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState<SchemeMatchResult[]>([]);

  // Load profile list and identify active profile
  useEffect(() => {
    async function initProfiles() {
      try {
        setLoading(true);
        setError(null);

        // Fetch available profiles
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
          setActiveProfileId(targetId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('vittmitra_active_profile_id', String(targetId));
          }
          const profData = await getUnifiedProfile(targetId);
          setProfile(profData);

          const matchRes = await getProfileMatching(targetId, 20, true);
          setMatchingData(matchRes);
        } else {
          // No profiles found in system
          setProfile(null);
          setMatchingData(null);
        }
      } catch (err: any) {
        console.error('Failed to load schemes matching:', err);
        setError(err.message || 'Failed to evaluate scheme matches. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    }

    initProfiles();
  }, [profileIdQuery]);

  // Handle Switching Active Profile
  const handleProfileChange = async (newId: number) => {
    try {
      setLoading(true);
      setActiveProfileId(newId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vittmitra_active_profile_id', String(newId));
      }
      router.push(`/schemes?profile_id=${newId}`);
      const profData = await getUnifiedProfile(newId);
      setProfile(profData);
      const matchRes = await getProfileMatching(newId, 20, true);
      setMatchingData(matchRes);
      setSelectedForCompare([]);
    } catch (err: any) {
      console.error('Failed to switch profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Compare Selection
  const handleToggleCompare = (scheme: SchemeMatchResult) => {
    const sId = scheme.scheme_id || scheme.id || 0;
    setSelectedForCompare(prev => {
      const exists = prev.some(s => (s.scheme_id || s.id) === sId);
      if (exists) {
        return prev.filter(s => (s.scheme_id || s.id) !== sId);
      } else {
        if (prev.length >= 4) {
          alert('You can compare a maximum of 4 schemes simultaneously.');
          return prev;
        }
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
      results = results.filter(s => s.sectors?.some(sec => sec.toLowerCase() === selectedSector.toLowerCase()));
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
  const countEligible = allResults.filter(m => m.match_category === 'ELIGIBLE').length;
  const countPotential = allResults.filter(m => m.match_category === 'POTENTIALLY_RELEVANT').length;
  const countNotEligible = allResults.filter(m => m.match_category === 'NOT_ELIGIBLE').length;

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem 8rem 1.5rem' }}>
      {/* Header & Navigation */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              ← Dashboard
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>Schemes For You</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Personalized <span className="gradient-text">Government Scheme Matches</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
            Deterministic rule evaluation & explainable ranking based on your profile inputs.
          </p>
        </div>

        {/* Profile Switcher / Create New */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {availableProfiles.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <User size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profile:</span>
              <select
                value={activeProfileId || ''}
                onChange={(e) => handleProfileChange(Number(e.target.value))}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {availableProfiles.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#111827', color: '#fff' }}>
                    {p.full_name} (#{p.id})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Link href="/onboarding" className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
            <PlusCircle size={15} />
            <span>New Profile</span>
          </Link>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={36} color="#38bdf8" className="animate-spin" style={{ margin: '0 auto 1.25rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Evaluating Government Schemes...
          </h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto' }}>
            Running deterministic eligibility operators and multi-dimensional financial scoring for your profile.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          style={{
            padding: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '2rem',
            color: '#f87171',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>Error Evaluating Matches</span>
          </div>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* No Profile Warning / Empty State */}
      {!loading && !profile && !error && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <User size={48} color="#38bdf8" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            No Entrepreneur Profile Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
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
            className="glass-panel"
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              background: 'rgba(17, 24, 39, 0.65)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Applicant
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {profile.entrepreneur.full_name}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Demographics
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {profile.entrepreneur.gender}, {profile.entrepreneur.age} yrs • {profile.entrepreneur.category}
                </div>
              </div>

              {profile.business_profiles?.[0]?.sector && (
                <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Sector & Enterprise
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
                    {profile.business_profiles[0].sector.replace('_', ' ')} • {profile.business_profiles[0].business_stage?.replace('_', ' ')}
                  </div>
                </div>
              )}

              {profile.financial_profiles?.[0]?.project_cost && (
                <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Project Cost
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#34d399', fontWeight: 700 }}>
                    ₹{Number(profile.financial_profiles[0].project_cost).toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Location
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
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
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Compass size={14} />
                <span>Location Feasibility</span>
              </Link>

              {/* Completeness Pill */}
              {(() => {
                const compPct = profile.completeness?.completion_percentage ?? profile.completeness?.overall_percentage ?? 100;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Profile Completeness</div>
                      <strong style={{ fontSize: '0.9rem', color: compPct === 100 ? '#34d399' : '#f59e0b' }}>
                        {compPct}%
                      </strong>
                    </div>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: `3px solid ${compPct === 100 ? '#10b981' : '#f59e0b'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
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
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} />
                  <span>
                    Profile is <strong>{compPct}% complete</strong>. Missing fields: {missingList.slice(0, 3).join(', ')}{missingList.length > 3 ? '...' : ''}. Completing them will unlock precise verification and subsidy estimates.
                  </span>
                </div>
                <Link href="/onboarding" style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
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
                borderBottom: '1px solid var(--border-subtle)',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveCategoryTab('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'ALL' ? '2px solid #38bdf8' : '2px solid transparent',
                  padding: '0.6rem 1rem',
                  color: activeCategoryTab === 'ALL' ? '#38bdf8' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>All Schemes</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
                  {matchingData.total_schemes_evaluated}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('ELIGIBLE')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'ELIGIBLE' ? '2px solid #10b981' : '2px solid transparent',
                  padding: '0.6rem 1rem',
                  color: activeCategoryTab === 'ELIGIBLE' ? '#34d399' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <CheckCircle2 size={15} color={activeCategoryTab === 'ELIGIBLE' ? '#34d399' : 'var(--text-muted)'} />
                <span>Top Matches (Eligible)</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
                  {countEligible}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('POTENTIALLY_RELEVANT')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'POTENTIALLY_RELEVANT' ? '2px solid #f59e0b' : '2px solid transparent',
                  padding: '0.6rem 1rem',
                  color: activeCategoryTab === 'POTENTIALLY_RELEVANT' ? '#fbbf24' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <AlertTriangle size={15} color={activeCategoryTab === 'POTENTIALLY_RELEVANT' ? '#fbbf24' : 'var(--text-muted)'} />
                <span>Needs Verification</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
                  {countPotential}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('NOT_ELIGIBLE')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategoryTab === 'NOT_ELIGIBLE' ? '2px solid #ef4444' : '2px solid transparent',
                  padding: '0.6rem 1rem',
                  color: activeCategoryTab === 'NOT_ELIGIBLE' ? '#f87171' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <XCircle size={15} color={activeCategoryTab === 'NOT_ELIGIBLE' ? '#f87171' : 'var(--text-muted)'} />
                <span>Not Currently Eligible</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
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
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.45rem 0.85rem',
                  flex: 1,
                  minWidth: '240px',
                  maxWidth: '380px',
                }}
              >
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search scheme name, ministry, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>

              {/* Filters & Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Sector Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.45rem 0.75rem' }}>
                  <Filter size={14} color="var(--text-muted)" />
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      border: 'none',
                      fontSize: '0.825rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL" style={{ background: '#111827' }}>All Sectors</option>
                    <option value="manufacturing" style={{ background: '#111827' }}>Manufacturing</option>
                    <option value="services" style={{ background: '#111827' }}>Services</option>
                    <option value="trading" style={{ background: '#111827' }}>Trading & Retail</option>
                    <option value="handicrafts" style={{ background: '#111827' }}>Handicrafts & Artisans</option>
                    <option value="agro_allied" style={{ background: '#111827' }}>Agro-Allied</option>
                    <option value="street_vendor" style={{ background: '#111827' }}>Street Vending</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.45rem 0.75rem' }}>
                  <ArrowUpDown size={14} color="var(--text-muted)" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      border: 'none',
                      fontSize: '0.825rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="SCORE_DESC" style={{ background: '#111827' }}>Highest Match Score</option>
                    <option value="SUBSIDY_DESC" style={{ background: '#111827' }}>Highest Subsidy Rate (%)</option>
                    <option value="LOAN_DESC" style={{ background: '#111827' }}>Highest Loan Cap (₹)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Scheme Cards Grid */}
          {filteredSchemes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Layers size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No schemes found matching criteria
              </h3>
              <p style={{ fontSize: '0.85rem' }}>
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
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <ShieldCheck size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Statutory & Advisory Notice: </strong>
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
        <main className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p>Loading Scheme Discovery Engine...</p>
        </main>
      }
    >
      <SchemesContent />
    </React.Suspense>
  );
}
