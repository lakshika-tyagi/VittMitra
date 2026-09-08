'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  Plus,
  AlertTriangle,
  RefreshCw,
  Building2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchSchemes,
  fetchSchemeDetail,
  getProfileMatching,
  getUnifiedProfile,
  listProfiles,
} from '@/services/api';
import {
  SchemeDetailResponse,
  SchemeListResponse,
  SchemeMatchResult,
  UnifiedProfileResponse,
} from '@/types';
import SchemeComparisonTable from '@/components/schemes/SchemeComparisonTable';

function CompareSchemesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idsParam = searchParams.get('ids');
  const profileIdParam = searchParams.get('profile_id');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [allAvailableSchemes, setAllAvailableSchemes] = useState<SchemeListResponse[]>([]);
  const [comparedSchemes, setComparedSchemes] = useState<SchemeDetailResponse[]>([]);
  const [matchingResultsMap, setMatchingResultsMap] = useState<Record<number, SchemeMatchResult>>({});
  const [profile, setProfile] = useState<UnifiedProfileResponse | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Initialize and load compared schemes
  useEffect(() => {
    async function loadComparison() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all active schemes list for addition options
        const allSchemes = await fetchSchemes();
        setAllAvailableSchemes(allSchemes);

        // Determine active profile ID
        let profileId: number | null = null;
        if (profileIdParam && !isNaN(Number(profileIdParam))) {
          profileId = Number(profileIdParam);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('vittmitra_active_profile_id');
          if (stored && !isNaN(Number(stored))) {
            profileId = Number(stored);
          }
        }

        if (!profileId) {
          const profiles = await listProfiles();
          if (profiles.length > 0) {
            profileId = profiles[0].id;
          }
        }

        // Fetch Profile & Profile Matching if profileId is found
        if (profileId) {
          try {
            const profData = await getUnifiedProfile(profileId);
            setProfile(profData);

            const matchRes = await getProfileMatching(profileId, 20, true);
            const map: Record<number, SchemeMatchResult> = {};
            const matchesList = matchRes.results || matchRes.matches || [];
            matchesList.forEach(m => {
              const sid = m.scheme_id || m.id;
              if (sid) {
                map[sid] = m;
              }
            });
            setMatchingResultsMap(map);
          } catch (pErr) {
            console.warn('Could not load profile matching for compare:', pErr);
          }
        }

        // Parse IDs from query param
        let targetIds: number[] = [];
        if (idsParam) {
          targetIds = idsParam
            .split(',')
            .map(idStr => Number(idStr.trim()))
            .filter(num => !isNaN(num) && num > 0);
        }

        // If no IDs given or less than 2, default to the top 2 schemes
        if (targetIds.length === 0 && allSchemes.length >= 2) {
          targetIds = [allSchemes[0].id, allSchemes[1].id];
        }

        // Enforce 4 schemes max limit
        if (targetIds.length > 4) {
          targetIds = targetIds.slice(0, 4);
        }

        // Fetch full details for each compared scheme
        const detailPromises = targetIds.map(id => fetchSchemeDetail(String(id)));
        const details = await Promise.all(detailPromises);
        setComparedSchemes(details);
      } catch (err: any) {
        console.error('Failed to load scheme comparison:', err);
        setError(err.message || 'Failed to load schemes for comparison.');
      } finally {
        setLoading(false);
      }
    }

    loadComparison();
  }, [idsParam, profileIdParam]);

  // Update query params when scheme selection changes
  const updateUrlWithIds = (newIds: number[]) => {
    const idsStr = newIds.join(',');
    const pId = profile?.entrepreneur?.id;
    if (pId) {
      router.push(`/schemes/compare?ids=${idsStr}&profile_id=${pId}`);
    } else {
      router.push(`/schemes/compare?ids=${idsStr}`);
    }
  };

  // Remove a scheme from comparison
  const handleRemoveScheme = (schemeId: number) => {
    if (comparedSchemes.length <= 2) {
      alert('A minimum of 2 schemes is required for comparison.');
      return;
    }
    const newSchemes = comparedSchemes.filter(s => s.id !== schemeId);
    setComparedSchemes(newSchemes);
    updateUrlWithIds(newSchemes.map(s => s.id));
  };

  // Add a scheme to comparison
  const handleAddScheme = async (schemeId: number) => {
    if (comparedSchemes.length >= 4) {
      alert('You can compare a maximum of 4 schemes simultaneously.');
      return;
    }
    if (comparedSchemes.some(s => s.id === schemeId)) {
      alert('This scheme is already in the comparison.');
      return;
    }

    try {
      setLoading(true);
      const newDetail = await fetchSchemeDetail(String(schemeId));
      const newSchemes = [...comparedSchemes, newDetail];
      setComparedSchemes(newSchemes);
      setIsAddModalOpen(false);
      updateUrlWithIds(newSchemes.map(s => s.id));
    } catch (err: any) {
      alert(`Could not add scheme: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const profileId = profile?.entrepreneur?.id;
  const backHref = profileId ? `/schemes?profile_id=${profileId}` : '/schemes';

  return (
    <main style={{ maxWidth: '1380px', margin: '0 auto', padding: '2rem 1.5rem 6rem 1.5rem' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <Link href={backHref} style={{ color: '#64748b', textDecoration: 'none' }}>Schemes For You</Link>
        <span>/</span>
        <span style={{ color: '#2563eb', fontWeight: 700 }}>Compare Schemes</span>
      </div>

      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.025em', color: '#0f172a' }}>
            Side-by-Side <span className="gradient-text">Scheme Comparison</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0 }}>
            Compare benefits, subsidies, eligibility criteria, and document requirements across 2 to 4 government schemes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {comparedSchemes.length < 4 && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <Plus size={15} />
              <span>Add Scheme to Compare ({comparedSchemes.length}/4)</span>
            </button>
          )}

          <Link href={backHref} className="btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <ArrowLeft size={15} />
            <span>Back to Schemes</span>
          </Link>
        </div>
      </header>

      {/* Profile Notice if profile is linked */}
      {profile && (
        <section
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d4ed8', fontWeight: 600 }}>
            <CheckCircle2 size={16} color="#2563eb" />
            <span>
              Comparing for <strong>{profile.entrepreneur.full_name}</strong> ({profile.entrepreneur.gender}, {profile.entrepreneur.category} • {profile.entrepreneur.district}, {profile.entrepreneur.state})
            </span>
          </div>
          <Link href="/onboarding" style={{ color: '#2563eb', fontSize: '0.825rem', fontWeight: 700, textDecoration: 'none' }}>
            Edit Profile →
          </Link>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
          <RefreshCw size={36} color="#2563eb" className="animate-spin" style={{ margin: '0 auto 1.25rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Loading Side-by-Side Scheme Matrix...
          </h3>
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
            <span>Comparison Error</span>
          </div>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Main Comparison Table */}
      {!loading && !error && (
        <div style={{ marginBottom: '2.5rem' }}>
          <SchemeComparisonTable
            schemes={comparedSchemes}
            matchingResults={matchingResultsMap}
            profile={profile}
            onRemoveScheme={handleRemoveScheme}
          />
        </div>
      )}

      {/* Add Scheme Modal / Dropdown Dialog */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '1.75rem',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Select Scheme to Add
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
              {allAvailableSchemes
                .filter(s => !comparedSchemes.some(cs => cs.id === s.id))
                .map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAddScheme(s.id)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.875rem 1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                      e.currentTarget.style.borderColor = '#bfdbfe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                        {s.scheme_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {s.scheme_code} • {s.nodal_ministry}
                      </div>
                    </div>
                    <span className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      Select
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Regulatory Notice */}
      <section
        style={{
          padding: '1.25rem',
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
        <ShieldCheck size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#0f172a', fontWeight: 700 }}>Comparison Disclaimer: </strong>
          Parameters and criteria compared above reflect operational guidelines published by relevant Government of India ministries. Margin requirements and interest subventions are subject to bank credit policy and verified applicant credentials.
        </div>
      </section>
    </main>
  );
}

export default function CompareSchemesPage() {
  return (
    <React.Suspense
      fallback={
        <main className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p>Loading Scheme Comparison Matrix...</p>
        </main>
      }
    >
      <CompareSchemesContent />
    </React.Suspense>
  );
}
