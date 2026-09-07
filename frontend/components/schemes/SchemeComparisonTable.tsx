'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';
import { SchemeDetailResponse, SchemeMatchResult, UnifiedProfileResponse } from '@/types';
import MatchBadge from './MatchBadge';

interface SchemeComparisonTableProps {
  schemes: SchemeDetailResponse[];
  matchingResults?: Record<number, SchemeMatchResult>;
  profile?: UnifiedProfileResponse | null;
  onRemoveScheme?: (schemeId: number) => void;
}

export const SchemeComparisonTable: React.FC<SchemeComparisonTableProps> = ({
  schemes,
  matchingResults = {},
  profile,
  onRemoveScheme,
}) => {
  if (!schemes || schemes.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <Layers size={40} color="#38bdf8" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          No Schemes Selected for Comparison
        </h3>
        <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
          Select 2 to 4 government schemes from the results list to view a detailed side-by-side comparison of benefits, eligibility, subsidies, and requirements.
        </p>
        <Link href="/schemes" className="btn-primary">
          Browse Schemes For You →
        </Link>
      </div>
    );
  }

  const profileId = profile?.entrepreneur?.id;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '1.5rem' }}>
      <table
        style={{
          width: '100%',
          minWidth: `${schemes.length * 280 + 200}px`,
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 10,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '1.25rem',
                textAlign: 'left',
                borderBottom: '2px solid var(--border-subtle)',
                width: '220px',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Comparison Dimension
              </div>
            </th>

            {schemes.map((s) => {
              const match = matchingResults[s.id];
              return (
                <th
                  key={s.id}
                  style={{
                    padding: '1.25rem',
                    textAlign: 'left',
                    backgroundColor: 'rgba(17, 24, 39, 0.85)',
                    borderBottom: '2px solid var(--border-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                    verticalAlign: 'top',
                    minWidth: '280px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: '#38bdf8',
                        }}
                      >
                        {s.scheme_code}
                      </span>
                      {onRemoveScheme && schemes.length > 2 && (
                        <button
                          type="button"
                          onClick={() => onRemoveScheme(s.id)}
                          title="Remove from comparison"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {s.scheme_name}
                    </h4>

                    {match && (
                      <MatchBadge
                        category={match.match_category}
                        score={match.match_score}
                        size="sm"
                      />
                    )}

                    <Link
                      href={profileId ? `/schemes/${s.id}?profile_id=${profileId}` : `/schemes/${s.id}`}
                      className="btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        justifyContent: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <span>Full Details</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* Section: Sponsoring Ministry */}
          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Nodal Ministry
            </td>
            {schemes.map((s) => (
              <td
                key={s.id}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderLeft: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.825rem',
                }}
              >
                {s.nodal_ministry || 'Government of India'}
              </td>
            ))}
          </tr>

          {/* Section: Match Category & Score */}
          <tr>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Match Status & Score
            </td>
            {schemes.map((s) => {
              const match = matchingResults[s.id];
              return (
                <td
                  key={s.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                  }}
                >
                  {match ? (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: match.match_category === 'ELIGIBLE' ? '#34d399' : match.match_category === 'POTENTIALLY_RELEVANT' ? '#fbbf24' : '#f87171' }}>
                        {match.match_category === 'ELIGIBLE' ? '✓ Eligible / Strong Match' : match.match_category === 'POTENTIALLY_RELEVANT' ? '⚠ Needs Verification' : '✕ Not Eligible'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Score: {Math.round(match.match_score)}/100
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Evaluate via Profile</span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Section: Max Subsidy % */}
          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Government Subsidy Rate
            </td>
            {schemes.map((s) => {
              const maxSub = s.benefits_summary?.max_subsidy_pct || s.financial_specs?.max_subsidy_pct;
              return (
                <td
                  key={s.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                  }}
                >
                  {maxSub ? (
                    <strong style={{ color: '#34d399', fontSize: '1rem' }}>
                      Up to {maxSub}%
                    </strong>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                      Interest Subvention / Collateral Guarantee
                    </span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Section: Max Loan Amount */}
          <tr>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Max Loan / Project Cap
            </td>
            {schemes.map((s) => {
              const maxLoan = s.benefits_summary?.max_loan_amount || s.financial_specs?.max_loan_amount;
              return (
                <td
                  key={s.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                  }}
                >
                  {maxLoan ? (
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      ₹{(maxLoan / 100000).toLocaleString('en-IN')} Lakh
                    </strong>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Project specific</span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Section: Margin Money Requirement */}
          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Own Margin Money Required
            </td>
            {schemes.map((s) => {
              const margin = s.benefits_summary?.margin_money_pct || s.financial_specs?.min_margin_money_pct;
              return (
                <td
                  key={s.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                >
                  {margin ? `${margin}% (Special: 5%)` : '5% - 15%'}
                </td>
              );
            })}
          </tr>

          {/* Section: Eligible Sectors */}
          <tr>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Eligible Sectors
            </td>
            {schemes.map((s) => (
              <td
                key={s.id}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderLeft: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {s.sectors.map((sec, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {sec.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </tr>

          {/* Section: Target Beneficiaries */}
          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Target Beneficiaries
            </td>
            {schemes.map((s) => (
              <td
                key={s.id}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderLeft: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {s.target_beneficiaries.map((ben, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                      }}
                    >
                      {ben}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </tr>

          {/* Section: Required Documents Count */}
          <tr>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Documentation Required
            </td>
            {schemes.map((s) => {
              const docCount = s.documents?.length || 0;
              const mandatoryCount = s.documents?.filter(d => d.is_mandatory).length || 0;
              return (
                <td
                  key={s.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{docCount} Documents Total</strong>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    ({mandatoryCount} Mandatory, {docCount - mandatoryCount} Conditional)
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Section: Official Source / Policy Link */}
          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                padding: '0.875rem 1.25rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Policy Source & Link
            </td>
            {schemes.map((s) => {
              const primarySrc = s.sources && s.sources.length > 0 ? s.sources[0] : null;
              const url = primarySrc?.official_url || primarySrc?.source_url;

              return (
                <td
                  key={s.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                  }}
                >
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        color: '#38bdf8',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <span>Official Portal</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ministry Guidelines
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SchemeComparisonTable;
