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
        backgroundColor: '#ffffff',
        border: `1px solid ${isSelectedForCompare ? '#2563eb' : '#e2e8f0'}`,
        boxShadow: isSelectedForCompare
          ? '0 0 20px rgba(37, 99, 235, 0.18), 0 4px 12px rgba(0, 0, 0, 0.05)'
          : '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        borderRadius: '16px',
      }}
    >
      {/* Top Bar: Ministry / Code + Compare Checkbox */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700 }}>
            <Building2 size={14} />
            <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scheme.nodal_ministry || 'Government of India'}
            </span>
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
              backgroundColor: isSelectedForCompare ? '#eff6ff' : '#ffffff',
              border: `1px solid ${isSelectedForCompare ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: '6px',
              padding: '0.3rem 0.55rem',
              color: isSelectedForCompare ? '#1d4ed8' : disableCompareSelect ? '#94a3b8' : '#475569',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: (!isSelectedForCompare && disableCompareSelect) ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isSelectedForCompare ? <CheckSquare size={14} color="#2563eb" /> : <Square size={14} />}
            <span>Compare</span>
          </button>
        </div>

        {/* Scheme Name & Code */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a', lineHeight: 1.35 }}>
          <Link
            href={detailUrl}
            style={{
              color: 'inherit',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
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
              backgroundColor: '#f1f5f9',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              color: '#475569',
              border: '1px solid #e2e8f0',
            }}
          >
            {scheme.scheme_code}
          </span>
          {scheme.geography_level && (
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
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
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.875rem',
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
              <Percent size={13} color="#059669" />
              <span>Max Subsidy</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: maxSubsidyPct ? '#059669' : '#0f172a' }}>
              {maxSubsidyPct ? `Up to ${maxSubsidyPct}%` : 'Subvention / Guarantee'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
              <IndianRupee size={13} color="#2563eb" />
              <span>Max Project Cap</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              {maxLoanAmount ? `₹${(maxLoanAmount / 100000).toLocaleString('en-IN')} Lakh` : 'Project Specific'}
            </div>
          </div>
        </div>

        {/* Deterministic Evaluation Reasons */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {topPositiveReasons.map((reason, i) => (
            <div
              key={i}
              style={{
                fontSize: '0.8rem',
                color: '#065f46',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                lineHeight: 1.35,
              }}
            >
              <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
              <span>{reason}</span>
            </div>
          ))}

          {topNegativeReasons.map((reason, i) => (
            <div
              key={i}
              style={{
                fontSize: '0.8rem',
                color: '#991b1b',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                lineHeight: 1.35,
              }}
            >
              <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>
              <span>{reason}</span>
            </div>
          ))}

          {unverifiedCount > 0 && topPositiveReasons.length === 0 && topNegativeReasons.length === 0 && (
            <div
              style={{
                fontSize: '0.8rem',
                color: '#92400e',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                lineHeight: 1.35,
              }}
            >
              ⚠ {unverifiedCount} conditions require verified document checks
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1rem',
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Official Gov Scheme
        </span>

        <Link
          href={detailUrl}
          className="btn-secondary"
          style={{
            padding: '0.45rem 0.95rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            gap: '0.4rem',
          }}
        >
          <span>View Guidelines</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default SchemeCard;
