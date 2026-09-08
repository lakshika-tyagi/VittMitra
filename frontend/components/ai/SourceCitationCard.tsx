'use client';

import React from 'react';
import { CitationSource } from '@/types';
import { ExternalLink, BookOpen, ShieldCheck } from 'lucide-react';

interface SourceCitationCardProps {
  source: CitationSource;
  className?: string;
}

export const SourceCitationCard: React.FC<SourceCitationCardProps> = ({ source, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        padding: '0.75rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <BookOpen size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
              {source.source_name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', fontWeight: 600 }}>
                <ShieldCheck size={12} />
                {source.source_type || 'OFFICIAL_GUIDELINE'}
              </span>
              {source.section_type && (
                <span style={{ color: '#64748b' }}>• Section: {source.section_type.replace(/_/g, ' ')}</span>
              )}
              {source.last_verified_at && (
                <span style={{ color: '#64748b' }}>
                  • Verified: {new Date(source.last_verified_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {source.official_url && (
          <a
            href={source.official_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              textDecoration: 'none',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Open official government source"
          >
            <span>View Source</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
};
