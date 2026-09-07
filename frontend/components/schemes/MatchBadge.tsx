'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { MatchCategory, DimensionScore } from '@/types';

interface MatchBadgeProps {
  category: MatchCategory;
  score?: number;
  dimensions?: DimensionScore;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({
  category,
  score,
  dimensions,
  showScore = true,
  size = 'md',
}) => {
  const getCategoryConfig = (cat: MatchCategory) => {
    switch (cat) {
      case 'ELIGIBLE':
        return {
          label: 'Strong Match',
          sublabel: 'Eligible',
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.12)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          textColor: '#34d399',
          icon: <CheckCircle2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color="#34d399" />,
        };
      case 'POTENTIALLY_RELEVANT':
        return {
          label: 'Needs Verification',
          sublabel: 'Potentially Relevant',
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.12)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          textColor: '#fbbf24',
          icon: <AlertTriangle size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color="#fbbf24" />,
        };
      case 'NOT_ELIGIBLE':
      default:
        return {
          label: 'Not Currently Eligible',
          sublabel: 'Ineligible',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.12)',
          borderColor: 'rgba(239, 68, 68, 0.35)',
          textColor: '#f87171',
          icon: <XCircle size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color="#f87171" />,
        };
    }
  };

  const config = getCategoryConfig(category);
  const formattedScore = score !== undefined ? Math.round(score) : null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
      {/* Category Pill */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: size === 'sm' ? '0.2rem 0.5rem' : size === 'lg' ? '0.4rem 1rem' : '0.3rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          color: config.textColor,
          fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.825rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        {config.icon}
        <span>{config.label}</span>
      </span>

      {/* Match Score Display */}
      {showScore && formattedScore !== null && (
        <div
          title="VittMitra relevance score based on your profile and available scheme information."
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: size === 'sm' ? '0.2rem 0.5rem' : size === 'lg' ? '0.4rem 0.85rem' : '0.3rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.825rem',
            color: 'var(--text-primary)',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>Match:</span>
          <strong style={{ color: config.textColor, fontWeight: 700 }}>{formattedScore}/100</strong>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'help',
              opacity: 0.6,
            }}
          >
            <Info size={12} />
          </span>
        </div>
      )}
    </div>
  );
};

export default MatchBadge;
