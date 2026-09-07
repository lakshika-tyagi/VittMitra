'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import { MatchReasons } from '@/types';

interface WhyThisSchemeProps {
  reasons: MatchReasons;
  schemeName?: string;
}

export const WhyThisScheme: React.FC<WhyThisSchemeProps> = ({
  reasons,
  schemeName,
}) => {
  const positiveList: string[] = reasons.positive || reasons.positive_reasons || [];
  const negativeList: string[] = reasons.negative || reasons.negative_reasons || [];
  const unverifiedList: string[] = reasons.unverified || reasons.unverified_warnings || [];

  const hasPositive = positiveList.length > 0;
  const hasNegative = negativeList.length > 0;
  const hasUnverified = unverifiedList.length > 0;

  if (!hasPositive && !hasNegative && !hasUnverified) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Positive Reasons: Why it Matches */}
      {hasPositive && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '0.625rem',
            }}
          >
            <CheckCircle2 size={16} color="#34d399" />
            <span>Why This Scheme Matches Your Profile</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {positiveList.map((reason: string, idx: number) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }}>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Negative Reasons: Why Not Eligible / Gaps */}
      {hasNegative && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '0.625rem',
            }}
          >
            <XCircle size={16} color="#f87171" />
            <span>Eligibility Disqualifiers & Critical Gaps</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {negativeList.map((reason: string, idx: number) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }}>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unverified Warnings / Missing Profile Data */}
      {hasUnverified && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#fbbf24',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '0.625rem',
            }}
          >
            <ShieldAlert size={16} color="#fbbf24" />
            <span>Information Requiring Verification</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {unverifiedList.map((warn: string, idx: number) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }}>⚠</span>
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WhyThisScheme;
