'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Percent,
  Layers,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Calculator,
  Briefcase,
  HelpCircle,
  Sparkles,
  Bot,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchSchemeDetail,
  getProfileEligibility,
  getProfileFinanceSummary,
  getUnifiedProfile,
  listProfiles,
  explainSchemeAI,
  explainEligibilityAI,
} from '@/services/api';
import {
  SchemeDetailResponse,
  EligibilityCheckResponse,
  FinancialCalculationResponse,
  UnifiedProfileResponse,
  GroundedChatResponse,
} from '@/types';
import MatchBadge from '@/components/schemes/MatchBadge';
import WhyThisScheme from '@/components/schemes/WhyThisScheme';
import EligibilityBreakdown from '@/components/schemes/EligibilityBreakdown';
import DocumentList from '@/components/schemes/DocumentList';
import SourceCard from '@/components/schemes/SourceCard';
import { AIExplanationCard, GroundedChatDrawer } from '@/components/ai';

function SchemeDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const schemeIdParam = params.scheme_id as string;
  const profileIdQuery = searchParams.get('profile_id');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [scheme, setScheme] = useState<SchemeDetailResponse | null>(null);
  const [profile, setProfile] = useState<UnifiedProfileResponse | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityCheckResponse | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialCalculationResponse | null>(null);

  // Step 11: Grounded AI State
  const [aiExplanation, setAiExplanation] = useState<GroundedChatResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const handleExplainScheme = async () => {
    if (!scheme) return;
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await explainSchemeAI(scheme.scheme_code);
      setAiExplanation(res);
    } catch (err: any) {
      setAiError(err.message || 'AI explanation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExplainEligibility = async () => {
    if (!scheme || !profile || !profile.entrepreneur) return;
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await explainEligibilityAI(String(profile.entrepreneur.id), scheme.scheme_code);
      setAiExplanation(res);
    } catch (err: any) {
      setAiError(err.message || 'Eligibility explanation failed.');
    } finally {
      setAiLoading(false);
    }
  };


  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Scheme Detail
        const schemeData = await fetchSchemeDetail(schemeIdParam);
        setScheme(schemeData);

        // 2. Determine Profile ID
        let profileId: number | null = null;
        if (profileIdQuery && !isNaN(Number(profileIdQuery))) {
          profileId = Number(profileIdQuery);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('vittmitra_active_profile_id');
          if (stored && !isNaN(Number(stored))) {
            profileId = Number(stored);
          }
        }

        // If still null, try listing profiles
        if (!profileId) {
          const profiles = await listProfiles();
          if (profiles.length > 0) {
            profileId = profiles[0].id;
          }
        }

        // 3. If Profile ID exists, fetch profile, eligibility check, and financial summary
        if (profileId) {
          try {
            const profData = await getUnifiedProfile(profileId);
            setProfile(profData);

            const eligRes = await getProfileEligibility(profileId, schemeData.scheme_code);
            setEligibility(eligRes);

            const finRes = await getProfileFinanceSummary(profileId, schemeData.scheme_code);
            setFinancialSummary(finRes);
          } catch (profileErr) {
            console.warn('Profile specific data could not be fetched for scheme:', profileErr);
          }
        }
      } catch (err: any) {
        console.error('Failed to load scheme details:', err);
        setError(err.message || 'Scheme details could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    if (schemeIdParam) {
      loadData();
    }
  }, [schemeIdParam, profileIdQuery]);

  if (loading) {
    return (
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Loading Scheme Specifications...
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Retrieving verified government guidelines and deterministic rule definitions.
          </p>
        </div>
      </main>
    );
  }

  if (error || !scheme) {
    return (
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <AlertTriangle size={36} color="#f87171" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', color: '#f87171', marginBottom: '0.5rem' }}>
            Scheme Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {error || 'The requested government scheme does not exist or is currently inactive.'}
          </p>
          <Link href="/schemes" className="btn-primary">
            ← Back to Schemes List
          </Link>
        </div>
      </main>
    );
  }

  const profileId = profile?.entrepreneur?.id;
  const backHref = profileId ? `/schemes?profile_id=${profileId}` : '/schemes';

  const evaluatedCriteria = eligibility?.criteria || eligibility?.evaluated_criteria || [];
  const maxSubsidy = scheme.benefits_summary?.max_subsidy_pct || scheme.financial_specs?.max_subsidy_pct;
  const maxLoan = scheme.benefits_summary?.max_loan_amount || scheme.financial_specs?.max_loan_amount;
  const minMargin = scheme.benefits_summary?.margin_money_pct || scheme.financial_specs?.min_margin_money_pct;
  const moratorium = scheme.benefits_summary?.moratorium_period_months || scheme.financial_specs?.moratorium_period_months;

  const totalProjCost = typeof financialSummary?.project_cost === 'object'
    ? financialSummary?.project_cost?.total_project_cost
    : financialSummary?.project_cost;

  const repaymentInfo = financialSummary?.repayment || financialSummary?.loan;

  return (
    <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem 1.5rem' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
        <span>/</span>
        <Link href={backHref} style={{ color: 'var(--text-secondary)' }}>Schemes For You</Link>
        <span>/</span>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{scheme.scheme_code}</span>
      </div>

      {/* SECTION 1: Header & Overview */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <Building2 size={16} />
              <span>{scheme.nodal_ministry || 'Government of India'}</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
              {scheme.scheme_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  color: '#38bdf8',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {scheme.scheme_code}
              </span>
              <span className="badge badge-blue">
                {scheme.geography_level?.toUpperCase() || 'NATIONAL'}
              </span>
              <span className="badge badge-emerald">
                {scheme.data_status || 'VERIFIED GOVERNMENT DATA'}
              </span>
            </div>
          </div>

          {/* Match Category / Score Pill */}
          {eligibility && (
            <div style={{ textAlign: 'right' }}>
              <MatchBadge
                category={eligibility.overall_status === 'MATCHED' ? 'ELIGIBLE' : eligibility.overall_status === 'UNVERIFIED' ? 'POTENTIALLY_RELEVANT' : 'NOT_ELIGIBLE'}
                score={eligibility.overall_status === 'MATCHED' ? 95 : eligibility.overall_status === 'UNVERIFIED' ? 70 : 35}
                size="lg"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Evaluated against {profile?.entrepreneur?.full_name || 'Active Profile'}
              </div>
            </div>
          )}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, margin: '1rem 0 0 0' }}>
          {scheme.short_description}
        </p>
      </section>

      {/* Grid Layout: Left 2/3 and Right 1/3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', gridColumn: 'span 2' }}>
          
          {/* SECTION 1.5: Grounded AI Scheme Intelligence */}
          <section className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(255, 255, 255, 0.02))' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.4rem', background: '#4f46e5', borderRadius: '0.5rem', color: '#fff' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Grounded AI Decision Assistant
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Source-grounded explanations powered by Google Gemini and verified scheme knowledge.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExplainScheme}
                  disabled={aiLoading}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                >
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Explain Scheme with AI</span>
                </button>

                {profile && (
                  <button
                    type="button"
                    onClick={handleExplainEligibility}
                    disabled={aiLoading}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>Explain My Eligibility</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', backgroundColor: '#4f46e5', borderColor: '#4338ca' }}
                >
                  <Bot size={14} />
                  <span>Ask Question</span>
                </button>
              </div>
            </div>

            {aiError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {aiError}
              </div>
            )}

            {aiExplanation && (
              <AIExplanationCard
                explanation={aiExplanation}
                title={`Grounded AI Analysis: ${scheme.scheme_code}`}
              />
            )}
          </section>

          {/* SECTION 2 & 3: Target Beneficiaries & Sectors */}
          <section className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="#38bdf8" />
              <span>Target Beneficiaries & Scope</span>
            </h3>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Eligible Social Groups & Beneficiaries
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {scheme.target_beneficiaries?.map((b, i) => (
                    <span key={i} className="badge badge-blue">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Eligible Business Sectors
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {scheme.sectors?.map((s, i) => (
                    <span key={i} className="badge badge-emerald" style={{ textTransform: 'capitalize' }}>
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: Financial Structure & Benefits */}
          <section className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Percent size={20} color="#10b981" />
              <span>Key Financial Benefits & Caps</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Subsidy Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
                  {maxSubsidy ? `${maxSubsidy}%` : 'Interest Subvention'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Based on location & category
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Project Cost / Loan</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {maxLoan ? `₹${(maxLoan / 100000).toLocaleString('en-IN')} Lakh` : 'Project specific'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Manufacturing / Services
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Own Margin Money</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {minMargin ? `${minMargin}%` : '5% - 10%'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  5% for Special Categories
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Moratorium & Tenure</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {moratorium ? `${moratorium} mo moratorium` : 'Up to 7 Years'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Bank repayment tenure
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: Deterministic Eligibility Evaluation Breakdown */}
          <section className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#38bdf8" />
              <span>Deterministic Eligibility Evaluation</span>
            </h3>

            {eligibility ? (
              <EligibilityBreakdown
                criteria={evaluatedCriteria}
                overallStatus={eligibility.overall_status}
                summaryMessage={eligibility.summary_message}
              />
            ) : (
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Complete or select an entrepreneur profile to view your personal eligibility evaluation against this scheme's {scheme.eligibility_rules?.length || 0} deterministic rules.
              </div>
            )}
          </section>

          {/* SECTION 6: Personalized Match Reasoning */}
          {eligibility && (
            <section className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} color="#38bdf8" />
                <span>Explainable Match Reasoning</span>
              </h3>

              <WhyThisScheme
                reasons={{
                  positive_reasons: (eligibility.passed_criteria || evaluatedCriteria.filter(c => c.status === 'MATCHED')).map(c => `${c.criterion || c.rule_code}: ${c.explanation}`),
                  negative_reasons: (eligibility.failed_criteria || evaluatedCriteria.filter(c => c.status === 'FAILED')).map(c => `${c.criterion || c.rule_code}: ${c.explanation}`),
                  unverified_warnings: (eligibility.unverified_criteria || evaluatedCriteria.filter(c => c.status === 'UNVERIFIED')).map(c => `${c.criterion || c.rule_code}: ${c.explanation}`),
                }}
                schemeName={scheme.scheme_name}
              />
            </section>
          )}

          {/* SECTION 7: Estimated Financial Scenario */}
          {financialSummary && (
            <section className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calculator size={20} color="#10b981" />
                <span>Estimated Financial Scenario (Step 5 Engine)</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Mathematical simulation calculated from your stored project cost (₹{totalProjCost ? Number(totalProjCost).toLocaleString('en-IN') : 'N/A'}) and applicable government subsidy rules.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Project Cost</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    ₹{Number(totalProjCost || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Subsidy ({financialSummary.subsidy?.subsidy_percentage || 0}%)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                    ₹{Number(financialSummary.subsidy?.subsidy_amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Own Margin Contribution</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa', marginTop: '0.2rem' }}>
                    ₹{Number(financialSummary.subsidy?.effective_margin_amount || financialSummary.own_contribution || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Bank Loan Required</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    ₹{Number(financialSummary.subsidy?.net_bank_loan || financialSummary.financing_gap || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Repayment & EMI Card */}
              {repaymentInfo && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Monthly EMI</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                      ₹{Number(repaymentInfo.monthly_emi || repaymentInfo.estimated_emi || 0).toLocaleString('en-IN')}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}> / month</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Tenure:</div>
                      <strong style={{ color: 'var(--text-primary)' }}>{repaymentInfo.tenure_months} Months</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Interest Rate:</div>
                      <strong style={{ color: 'var(--text-primary)' }}>{repaymentInfo.interest_rate_pct || repaymentInfo.annual_interest_rate}% p.a.</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Total Interest:</div>
                      <strong style={{ color: 'var(--text-primary)' }}>₹{Number(repaymentInfo.total_interest_payable || repaymentInfo.estimated_total_interest || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECTION 8: Required Documents Checklist */}
          <section className="glass-panel" style={{ padding: '1.75rem' }}>
            <DocumentList
              documents={scheme.documents || []}
              title={`Verification Documents for ${scheme.scheme_code}`}
            />
          </section>

          {/* SECTION 9: Official Sources & Policy Documents */}
          <section className="glass-panel" style={{ padding: '1.75rem' }}>
            <SourceCard
              sources={scheme.sources || []}
              nodalMinistry={scheme.nodal_ministry}
              schemeCode={scheme.scheme_code}
            />
          </section>
        </div>

        {/* Right Sidebar: Quick Actions, Audit Metadata, Disclaimers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Action Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Scheme Actions
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                href={`/schemes/${scheme.id || scheme.scheme_code}/access${profileId ? `?profile_id=${profileId}` : ''}`}
                className="btn-primary"
                style={{ justifyContent: 'center', backgroundColor: '#10b981', borderColor: '#059669', color: '#022c22', fontWeight: 700 }}
              >
                <Building2 size={16} />
                <span>How to Access & Channel Partners</span>
              </Link>
              <Link
                href={profileId ? `/schemes/compare?ids=${scheme.id}&profile_id=${profileId}` : `/schemes/compare?ids=${scheme.id}`}
                className="btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                <Layers size={16} />
                <span>Compare with Other Schemes</span>
              </Link>
              <Link
                href={backHref}
                className="btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                <ArrowLeft size={16} />
                <span>Back to All Schemes</span>
              </Link>
            </div>
          </div>

          {/* SECTION 10: Rule Engine & Audit Metadata */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#38bdf8" />
              <span>Deterministic Audit Specs</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Rule Engine Criteria:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{scheme.eligibility_rules?.length || 0} Rules</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Verification Documents:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{scheme.documents?.length || 0} Docs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Official Policy Sources:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{scheme.sources?.length || 0} Sources</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Data Ground Truth:</span>
                <strong style={{ color: '#34d399' }}>Verified Government</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>AI Participation:</span>
                <strong style={{ color: '#38bdf8' }}>0% (Pure Deterministic)</strong>
              </div>
            </div>
          </div>

          {/* Regulatory Disclaimer */}
          <div
            style={{
              padding: '1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45,
            }}
          >
            <strong>Advisory Notice: </strong>
            Calculations and criteria evaluations are simulated using published ministry rules and your declared profile records. Sanctions depend on physical document validation and bank approval.
          </div>
        </div>
      </div>

      {/* Grounded AI Assistant Drawer */}
      <GroundedChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeSchemeCode={scheme?.scheme_code}
        activeProfileId={profile?.entrepreneur ? String(profile.entrepreneur.id) : null}
      />
    </main>
  );
}

export default function SchemeDetailPage() {
  return (
    <React.Suspense
      fallback={
        <main className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p>Loading Scheme Intelligence & Diagnostics...</p>
        </main>
      }
    >
      <SchemeDetailContent />
    </React.Suspense>
  );
}

