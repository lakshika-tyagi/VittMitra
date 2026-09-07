'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { SchemeDocument } from '@/types';

interface DocumentListProps {
  documents: SchemeDocument[];
  title?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  title = 'Required Verification Documents',
}) => {
  if (!documents || documents.length === 0) {
    return (
      <div
        style={{
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        No specific document requirements listed for this scheme. Standard KYC documents apply.
      </div>
    );
  }

  const mandatoryDocs = documents.filter(d => d.is_mandatory);
  const optionalDocs = documents.filter(d => !d.is_mandatory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with counts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="#38bdf8" />
          <span>{title} ({documents.length})</span>
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
            {mandatoryDocs.length} Mandatory
          </span>
          {optionalDocs.length > 0 && (
            <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
              {optionalDocs.length} Conditional / Optional
            </span>
          )}
        </div>
      </div>

      {/* Grid of Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {documents.map((doc, idx) => {
          const description = doc.description || doc.document_description;
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
                transition: 'border-color 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.35,
                    }}
                  >
                    {doc.document_name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: doc.is_mandatory ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      color: doc.is_mandatory ? '#f87171' : '#60a5fa',
                      border: `1px solid ${doc.is_mandatory ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {doc.is_mandatory ? 'Mandatory' : 'Conditional'}
                  </span>
                </div>

                {description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 0.5rem 0' }}>
                    {description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {doc.issuing_authority && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Issuing Authority: </span>
                    {doc.issuing_authority}
                  </div>
                )}
                {doc.purpose && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Purpose: </span>
                    {doc.purpose}
                  </div>
                )}
                {doc.document_code && (
                  <div style={{ fontFamily: 'monospace', opacity: 0.8 }}>
                    Code: {doc.document_code}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentList;
