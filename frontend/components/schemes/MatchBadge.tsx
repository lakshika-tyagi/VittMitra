'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
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
          color: '#059669',
          bgColor: '#ecfdf5',
          borderColor: '#a7f3d0',
          textColor: '#065f46',
          icon: <CheckCircle2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 15} color="#059669" />,
        };
      case 'POTENTIALLY_RELEVANT':
        return {
          label: 'Needs Verification',
          sublabel: 'Potentially Relevant',
          color: '#d97706',
          bgColor: '#fffbeb',
          borderColor: '#fde68a',
          textColor: '#92400e',
          icon: <AlertTriangle size={size === 'sm' ? 14 : size === 'lg' ? 18 : 15} color="#d97706" />,
        };
      case 'NOT_ELIGIBLE':
      default:
        return {
          label: 'Not Currently Eligible',
          sublabel: 'Ineligible',
          color: '#dc2626',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
          textColor: '#991b1b',
          icon: <XCircle size={size === 'sm' ? 14 : size === 'lg' ? 18 : 15} color="#dc2626" />,
        };
    }
  };

  const config = getCategoryConfig(category);
  const formattedScore = score !== undefined ? Math.round(score) : null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {/* Category Pill */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: size === 'sm' ? '0.2rem 0.55rem' : size === 'lg' ? '0.4rem 1rem' : '0.28rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          color: config.textColor,
          fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.9rem' : '0.8rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
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
            padding: size === 'sm' ? '0.2rem 0.5rem' : size === 'lg' ? '0.38rem 0.85rem' : '0.28rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.9rem' : '0.8rem',
            color: '#0f172a',
          }}
        >
          <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>Match:</span>
          <strong style={{ color: config.color, fontWeight: 800 }}>{formattedScore}/100</strong>
        </div>
      )}
    </div>
  );
};

export default MatchBadge;
