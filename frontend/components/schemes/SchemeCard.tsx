'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, CheckSquare, Square, Percent, IndianRupee } from 'lucide-react';
import { SchemeMatchResult } from '@/types';
import MatchBadge from './MatchBadge';

interface SchemeCardProps {
  scheme: SchemeMatchResult;
  profileId?: number | null;
  isSelectedForCompare: boolean;
  onToggleCompare: (scheme: SchemeMatchResult) => void;
  disableCompareSelect?: boolean;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  profileId,
  isSelectedForCompare,
  onToggleCompare,
  disableCompareSelect = false,
}) => {
  const schemeId = scheme.scheme_id || scheme.id || 0;
  const detailUrl = profileId
    ? `/schemes/${schemeId}?profile_id=${profileId}`
    : `/schemes/${schemeId}`;

  const positiveList = scheme.reasons?.positive || scheme.reasons?.positive_reasons || [];
  const negativeList = scheme.reasons?.negative || scheme.reasons?.negative_reasons || [];
  const unverifiedList = scheme.reasons?.unverified || scheme.reasons?.unverified_warnings || [];

  const topPositiveReasons = positiveList.slice(0, 2);
  const topNegativeReasons = negativeList.slice(0, 2);
  const unverifiedCount = scheme.eligibility_summary?.unverified_count || unverifiedList.length || 0;

  const maxSubsidyPct = scheme.financial_benefits?.max_subsidy_pct || scheme.financial_summary?.max_subsidy_pct;
  const maxLoanAmount = scheme.financial_benefits?.max_loan_amount || scheme.financial_summary?.max_loan_amount;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        borderColor: isSelectedForCompare ? '#38bdf8' : 'var(--border-subtle)',
        boxShadow: isSelectedForCompare
          ? '0 0 20px rgba(56, 189, 248, 0.25)'
          : 'var(--shadow-card)',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Top Bar: Ministry / Code + Compare Checkbox */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
            <Building2 size={14} />
            <span>{scheme.nodal_ministry || 'Government of India'}</span>
          </div>

          {/* Compare Checkbox */}
          <button
            type="button"
            onClick={() => onToggleCompare(scheme)}
            disabled={!isSelectedForCompare && disableCompareSelect}
            aria-label={isSelectedForCompare ? `Deselect ${scheme.scheme_name} from compare` : `Select ${scheme.scheme_name} to compare`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: isSelectedForCompare ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isSelectedForCompare ? '#38bdf8' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.3rem 0.55rem',
              color: isSelectedForCompare ? '#38bdf8' : disableCompareSelect ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: (!isSelectedForCompare && disableCompareSelect) ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isSelectedForCompare ? <CheckSquare size={14} color="#38bdf8" /> : <Square size={14} />}
            <span>Compare</span>
          </button>
        </div>

        {/* Scheme Name & Code */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
          <Link
            href={detailUrl}
            style={{
              color: 'inherit',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          >
            {scheme.scheme_name}
          </Link>
        </h3>

        {/* Scheme Code Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              color: '#94a3b8',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {scheme.scheme_code}
          </span>
          {scheme.geography_level && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              • {scheme.geography_level.toUpperCase()}
            </span>
          )}
        </div>

        {/* Match Badge & Score */}
        <div style={{ marginBottom: '1.25rem' }}>
          <MatchBadge
            category={scheme.match_category}
            score={scheme.match_score}
            dimensions={scheme.dimensions}
            size="md"
          />
        </div>

        {/* Key Scheme Benefits Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem',
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
          }}
        >
          {maxSubsidyPct ? (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Percent size={12} color="#10b981" />
                <span>Max Subsidy</span>
              </div>
              <strong style={{ fontSize: '0.95rem', color: '#34d399', fontWeight: 700 }}>
                Up to {maxSubsidyPct}%
              </strong>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Percent size={12} color="#38bdf8" />
                <span>Financial Assistance</span>
              </div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Interest Subvention
              </strong>
            </div>
          )}

          {maxLoanAmount ? (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <IndianRupee size={12} color="#38bdf8" />
                <span>Max Project / Loan</span>
              </div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                ₹{(maxLoanAmount / 100000).toLocaleString('en-IN')} Lakh
              </strong>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Margin Money
              </div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                5% - 15%
              </strong>
            </div>
          )}
        </div>

        {/* Explainability Snippets */}
        <div style={{ marginBottom: '1.25rem' }}>
          {scheme.match_category === 'ELIGIBLE' && topPositiveReasons.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Key Match Factors:
              </span>
              {topPositiveReasons.map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: 1.35 }}>
                  <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {scheme.match_category === 'POTENTIALLY_RELEVANT' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verification Needed:
              </span>
              {unverifiedList.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: 1.35 }}>
                  <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚠</span>
                  <span>{unverifiedList[0]}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: 1.35 }}>
                  <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚠</span>
                  <span>Requires {unverifiedCount} profile data / document verification check(s).</span>
                </div>
              )}
            </div>
          )}

          {scheme.match_category === 'NOT_ELIGIBLE' && topNegativeReasons.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Unmet Criteria:
              </span>
              {topNegativeReasons.map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: 1.35 }}>
                  <span style={{ color: '#ef4444', flexShrink: 0 }}>✕</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: View Details CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <Link
          href={detailUrl}
          className="btn-secondary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <span>View Scheme Details & Rules</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
};

export default SchemeCard;
