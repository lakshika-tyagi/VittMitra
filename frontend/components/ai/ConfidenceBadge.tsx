'use client';

import React from 'react';
import { ConfidenceLevel } from '@/types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = '' }) => {
  const getBadgeConfig = () => {
    switch (confidence) {
      case 'HIGH':
        return {
          label: 'Grounded Confidence: High',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'MEDIUM':
        return {
          label: 'Grounded Confidence: Medium',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'LOW':
        return {
          label: 'Confidence: Low (Limited Context)',
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-500',
        };
      case 'INSUFFICIENT_DATA':
      default:
        return {
          label: 'Insufficient Official Data',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
