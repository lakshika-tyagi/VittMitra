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
          color: '#64748b',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
        }}
      >
        <Layers size={40} color="#2563eb" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          No Schemes Selected for Comparison
        </h3>
        <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem', color: '#475569' }}>
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
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 10,
                backgroundColor: '#f8fafc',
                padding: '1.25rem',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
                width: '220px',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
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
                    backgroundColor: '#ffffff',
                    borderBottom: '2px solid #e2e8f0',
                    borderLeft: '1px solid #e2e8f0',
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
                          backgroundColor: '#eff6ff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
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
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '3px',
                            borderRadius: '4px',
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a', lineHeight: 1.3 }}>
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
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.78rem',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        fontWeight: 600,
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
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#ffffff',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
              }}
            >
              Nodal Ministry
            </td>
            {schemes.map((s) => (
              <td
                key={s.id}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                }}
              >
                {s.nodal_ministry || 'Government of India'}
              </td>
            ))}
          </tr>

          {/* Section: Match Category & Score */}
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#f8fafc',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
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
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: '1px solid #e2e8f0',
                  }}
                >
                  {match ? (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: match.match_category === 'ELIGIBLE' ? '#059669' : match.match_category === 'POTENTIALLY_RELEVANT' ? '#d97706' : '#dc2626' }}>
                        {match.match_category === 'ELIGIBLE' ? '✓ Eligible / Strong Match' : match.match_category === 'POTENTIALLY_RELEVANT' ? '⚠ Needs Verification' : '✕ Not Eligible'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Score: <strong>{Math.round(match.match_score)}/100</strong>
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Evaluate via Profile</span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Section: Max Subsidy % */}
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#ffffff',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
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
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: '1px solid #e2e8f0',
                  }}
                >
                  {maxSub ? (
                    <strong style={{ color: '#059669', fontSize: '1rem', fontWeight: 800 }}>
                      Up to {maxSub}%
                    </strong>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '0.825rem' }}>
                      Interest Subvention / Collateral Guarantee
                    </span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Section: Max Loan Amount */}
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#f8fafc',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
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
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: '1px solid #e2e8f0',
                  }}
                >
                  {maxLoan ? (
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 800 }}>
                      ₹{(maxLoan / 100000).toLocaleString('en-IN')} Lakh
                    </strong>
                  ) : (
                    <span style={{ color: '#64748b' }}>Project specific</span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Section: Margin Money Requirement */}
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#ffffff',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
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
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: '1px solid #e2e8f0',
                    color: '#0f172a',
                    fontWeight: 600,
                  }}
                >
                  {margin ? `${margin}% (Special: 5%)` : '5% - 15%'}
                </td>
              );
            })}
          </tr>

          {/* Section: Eligible Sectors */}
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#f8fafc',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
              }}
            >
              Eligible Sectors
            </td>
            {schemes.map((s) => (
              <td
                key={s.id}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {s.sectors.map((sec, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        fontWeight: 500,
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
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#ffffff',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
              }}
            >
              Target Beneficiaries
            </td>
            {schemes.map((s) => (
              <td
                key={s.id}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {s.target_beneficiaries.map((ben, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        fontWeight: 600,
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
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#f8fafc',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
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
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: '1px solid #e2e8f0',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#0f172a' }}>{docCount} Documents Total</strong>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    ({mandatoryCount} Mandatory, {docCount - mandatoryCount} Conditional)
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Section: Official Source / Policy Link */}
          <tr style={{ backgroundColor: '#ffffff' }}>
            <td
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#ffffff',
                padding: '0.875rem 1.25rem',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
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
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: '1px solid #e2e8f0',
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
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <span>Official Portal</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
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
