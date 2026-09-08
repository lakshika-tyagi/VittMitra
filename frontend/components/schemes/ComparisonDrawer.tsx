'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, X, ArrowRight, Trash2 } from 'lucide-react';
import { SchemeMatchResult, SchemeListResponse } from '@/types';

interface ComparisonDrawerProps {
  selectedSchemes: Array<SchemeMatchResult | SchemeListResponse>;
  onRemove: (schemeId: number) => void;
  onClear: () => void;
  profileId?: number | null;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  selectedSchemes,
  onRemove,
  onClear,
  profileId,
}) => {
  if (!selectedSchemes || selectedSchemes.length === 0) {
    return null;
  }

  const getSchemeId = (s: SchemeMatchResult | SchemeListResponse): number => {
    return 'scheme_id' in s ? (s.scheme_id || s.id || 0) : s.id;
  };

  const count = selectedSchemes.length;
  const isReadyToCompare = count >= 2 && count <= 4;
  const schemeIdsParam = selectedSchemes.map(s => getSchemeId(s)).join(',');
  const compareHref = profileId
    ? `/schemes/compare?ids=${schemeIdsParam}&profile_id=${profileId}`
    : `/schemes/compare?ids=${schemeIdsParam}`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '960px',
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 0 25px rgba(37, 99, 235, 0.12)',
        padding: '1rem 1.5rem',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Left: Info & Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                Compare Schemes ({count}/4)
              </div>
              <div style={{ fontSize: '0.75rem', color: isReadyToCompare ? '#059669' : '#d97706', fontWeight: 600 }}>
                {count < 2 ? 'Select at least 1 more scheme to compare' : `${count} schemes ready for side-by-side comparison`}
              </div>
            </div>
          </div>

          {/* Scheme Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selectedSchemes.map(s => {
              const sid = getSchemeId(s);
              return (
                <div
                  key={sid}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.8rem',
                    color: '#0f172a',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.scheme_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(sid)}
                    aria-label={`Remove ${s.scheme_name} from compare`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>

          {isReadyToCompare ? (
            <Link
              href={compareHref}
              className="btn-primary"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <span>Compare Now</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: '#f1f5f9',
                color: '#94a3b8',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>Select 2-4 Schemes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonDrawer;
