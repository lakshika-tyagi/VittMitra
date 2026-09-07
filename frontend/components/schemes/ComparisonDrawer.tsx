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
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.2)',
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Compare Schemes ({count}/4)
              </div>
              <div style={{ fontSize: '0.75rem', color: isReadyToCompare ? '#34d399' : '#f59e0b' }}>
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
                    padding: '0.3rem 0.6rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  <span>{s.scheme_code || s.scheme_name}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(sid)}
                    aria-label={`Remove ${s.scheme_name} from comparison`}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <X size={14} />
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
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>

          {isReadyToCompare ? (
            <Link
              href={compareHref}
              className="btn-primary"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.875rem',
                gap: '0.4rem',
              }}
            >
              <span>Compare Now ({count})</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>Compare (Min 2)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonDrawer;
