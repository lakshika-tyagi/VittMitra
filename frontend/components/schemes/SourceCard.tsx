'use client';

import React from 'react';
import { ShieldCheck, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { SchemeSource } from '@/types';

interface SourceCardProps {
  sources: SchemeSource[];
  nodalMinistry?: string;
  schemeCode?: string;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  sources,
  nodalMinistry,
  schemeCode,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="#10b981" />
          <span>Official Government Sources & Policy Citations</span>
        </h4>
        <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
          Verified Ground Truth
        </span>
      </div>

      {(!sources || sources.length === 0) ? (
        <div
          style={{
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          {nodalMinistry ? (
            <p style={{ margin: 0 }}>
              Official scheme policies are governed directly by <strong>{nodalMinistry}</strong>.
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Official ministry operational guidelines.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {sources.map((src, idx) => {
            const publisher = src.source_name || src.source_publisher || nodalMinistry || 'Government of India';
            const title = src.document_reference || src.source_title || `${schemeCode || 'Scheme'} Operational Guidelines`;
            const url = src.official_url || src.source_url;

            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <Building2 size={13} />
                    <span>{publisher}</span>
                  </div>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.35rem 0', lineHeight: 1.35 }}>
                    {title}
                  </h5>
                  {src.source_type && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Type: {src.source_type}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {src.version && (
                      <span>Ver: <code>{src.version}</code></span>
                    )}
                    {src.last_verified_at && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={11} color="var(--text-muted)" />
                        Verified: {new Date(src.last_verified_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.75rem',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <span>View Official Government Document</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ground Truth Disclaimer */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0.25rem 0 0 0' }}>
        * Note: Scheme terms, subsidy limits, and eligibility guidelines are retrieved from authoritative Government of India / State portals. Final sanctions are subject to lending institution appraisal.
      </p>
    </div>
  );
};

export default SourceCard;
