'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { CriterionResult, EligibilityStatus } from '@/types';

interface EligibilityBreakdownProps {
  criteria: CriterionResult[];
  overallStatus?: EligibilityStatus;
  summaryMessage?: string;
}

export const EligibilityBreakdown: React.FC<EligibilityBreakdownProps> = ({
  criteria,
  overallStatus,
  summaryMessage,
}) => {
  const getStatusBadge = (status: EligibilityStatus) => {
    switch (status) {
      case 'MATCHED':
        return {
          label: 'MATCHED',
          icon: <CheckCircle2 size={15} color="#34d399" />,
          color: '#34d399',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
        };
      case 'FAILED':
        return {
          label: 'FAILED',
          icon: <XCircle size={15} color="#f87171" />,
          color: '#f87171',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)',
        };
      case 'UNVERIFIED':
      default:
        return {
          label: 'UNVERIFIED',
          icon: <AlertTriangle size={15} color="#fbbf24" />,
          color: '#fbbf24',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
        };
    }
  };

  const formatApplicantValue = (val: any) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>Not Provided</span>;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'number') {
      if (val >= 1000) return `₹${val.toLocaleString('en-IN')}`;
      return String(val);
    }
    return String(val);
  };

  const matchedCount = criteria.filter(c => c.status === 'MATCHED').length;
  const failedCount = criteria.filter(c => c.status === 'FAILED').length;
  const unverifiedCount = criteria.filter(c => c.status === 'UNVERIFIED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Criteria Summary Pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.875rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Evaluation Breakdown:
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            ✓ {matchedCount} Matched
          </span>
          {failedCount > 0 && (
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              ✕ {failedCount} Failed
            </span>
          )}
          {unverifiedCount > 0 && (
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              ⚠ {unverifiedCount} Unverified
            </span>
          )}
        </div>

        {summaryMessage && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {summaryMessage}
          </span>
        )}
      </div>

      {/* Criteria Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.5rem 1rem' }}>Criterion / Rule</th>
              <th style={{ padding: '0.5rem 1rem' }}>Status</th>
              <th style={{ padding: '0.5rem 1rem' }}>Rule Condition</th>
              <th style={{ padding: '0.5rem 1rem' }}>Your Profile Value</th>
              <th style={{ padding: '0.5rem 1rem' }}>Explanation & Policy Source</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, idx) => {
              const statusCfg = getStatusBadge(c.status);
              const criterionLabel = c.criterion || c.criterion_name || c.rule_code;
              const applicantVal = c.user_value !== undefined ? c.user_value : c.applicant_value;
              const ruleCondition = c.required_condition || (c.operator ? `${c.operator} ${JSON.stringify(c.threshold_value)}` : 'Standard Guideline Rule');

              return (
                <tr
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {/* Criterion Name */}
                  <td
                    style={{
                      padding: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      borderTopLeftRadius: 'var(--radius-sm)',
                      borderBottomLeftRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid ${statusCfg.color}`,
                    }}
                  >
                    <div>{criterionLabel}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                      {c.rule_code}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        backgroundColor: statusCfg.bg,
                        border: `1px solid ${statusCfg.border}`,
                        color: statusCfg.color,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {statusCfg.icon}
                      <span>{statusCfg.label}</span>
                    </span>
                  </td>

                  {/* Condition */}
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                    <div style={{ maxWidth: '220px', wordBreak: 'break-word' }}>
                      <code style={{ color: '#38bdf8' }}>{ruleCondition}</code>
                    </div>
                  </td>

                  {/* Applicant Value */}
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.825rem' }}>
                    <div style={{ maxWidth: '180px', wordBreak: 'break-word' }}>
                      {formatApplicantValue(applicantVal)}
                    </div>
                  </td>

                  {/* Explanation & Source */}
                  <td
                    style={{
                      padding: '1rem',
                      borderTopRightRadius: 'var(--radius-sm)',
                      borderBottomRightRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                      {c.explanation}
                    </div>
                    {c.source_url ? (
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        <span>{c.source_name || 'Policy Source Reference'}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {c.source_name || 'Official Ministry Guideline'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EligibilityBreakdown;
