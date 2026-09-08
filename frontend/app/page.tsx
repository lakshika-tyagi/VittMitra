'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchHealth, listProfiles } from '@/services/api';
import { SystemHealthResponse, Entrepreneur } from '@/types';
import {
  ShieldCheck,
  CheckCircle2,
  CircleDot,
  Server,
  Cpu,
  Database,
  Layers,
  ArrowRight,
  LayoutDashboard,
  Compass,
  MapPin,
  FileText,
  UserPlus,
  Sparkles,
  Bot,
  TrendingUp,
  DollarSign,
  Award,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const WORKFLOW_STAGES = [
  { id: '1', title: 'Profile Onboarding', url: '/onboarding', desc: 'Demographic, sector & social background' },
  { id: '2', title: 'Profile Completeness', url: '/onboarding', desc: 'Section validation & missing fields check' },
  { id: '3', title: 'Location Feasibility', url: '/feasibility', desc: 'PostGIS district signals & cluster density' },
  { id: '4', title: 'Financial Structuring', url: '/schemes', desc: 'Formulaic project cost, subsidy & EMI' },
  { id: '5', title: 'Scheme Matching & Ranking', url: '/schemes', desc: 'Deterministic rule evaluation & scoring' },
  { id: '6', title: 'Scheme Comparison & Details', url: '/schemes', desc: 'Explainable rule evaluation breakdown' },
  { id: '7', title: 'Application Assistance', url: '/schemes', desc: 'Checklists, documents & verified portal URLs' },
  { id: '8', title: 'Tracking & AI Decision Support', url: '/dashboard', desc: 'User-recorded status & grounded Gemini copilot' },
];

export default function Home() {
  const router = useRouter();
  const { activeProfileId, availableProfiles, setActiveProfileId } = useProfile();
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkApi() {
      try {
        const data = await fetchHealth();
        setHealth(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkApi();
  }, []);

  const handleSelectProfileAndGo = (profileId: number) => {
    setActiveProfileId(profileId);
    router.push('/dashboard');
  };

  return (
    <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Hero / Platform Overview */}
      <section className="glass-panel" style={{ padding: '3rem 2.5rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            <CircleDot size={10} /> Verified Scheme & Intelligence Platform
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            <Sparkles size={12} /> Grounded Gemini AI
          </span>
        </div>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
          Intelligent Government Scheme Discovery & <span className="gradient-text">Unified Entrepreneur Dashboard</span>
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '840px', lineHeight: 1.6, marginBottom: '2.25rem' }}>
          VittMitra (वित्तमित्र) is an end-to-end intelligence platform bridging marginalized entrepreneurs and verified government schemes. Built on deterministic rule evaluation, PostGIS geospatial feasibility, financial amortization, and grounded AI decision support.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            <LayoutDashboard size={18} />
            <span>Open Entrepreneur Dashboard →</span>
          </Link>
          <Link href="/schemes" className="btn-secondary" style={{ padding: '0.9rem 1.75rem', fontSize: '1rem' }}>
            <Compass size={18} />
            <span>Explore Matched Schemes</span>
          </Link>
          <Link href="/onboarding" className="btn-secondary" style={{ padding: '0.9rem 1.75rem', fontSize: '1rem' }}>
            <UserPlus size={18} />
            <span>Onboard New Entrepreneur</span>
          </Link>
        </div>

        {/* System Health Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <Server size={15} color="#38bdf8" />
              <span>Next.js 14 Frontend</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>App Router Active</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <Cpu size={15} color="#34d399" />
              <span>FastAPI Backend Services</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: loading ? '#f59e0b' : health?.status === 'healthy' ? '#10b981' : '#ef4444',
                }}
              />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {loading ? 'Connecting...' : health?.status === 'healthy' ? 'Engines Ready (Port 8000)' : 'Service Offline'}
              </strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <Database size={15} color="#818cf8" />
              <span>Spatial Database</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>PostgreSQL + PostGIS</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Profile Launcher (Sample Demo Profiles) */}
      {availableProfiles.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <UserPlus size={18} color="#34d399" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Launch Experience as Seeded Entrepreneur Profile
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {availableProfiles.slice(0, 3).map((prof) => {
              const isCurrent = prof.id === activeProfileId;
              return (
                <div
                  key={prof.id}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem',
                    border: isCurrent ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                        Profile ID #{prof.id}
                      </span>
                      {isCurrent && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                          Active
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                      {prof.full_name}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      {prof.category || 'General'} • {prof.district || 'District N/A'}, {prof.state || ''}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectProfileAndGo(prof.id)}
                    type="button"
                    className="btn-primary"
                    style={{
                      padding: '0.55rem 1rem',
                      fontSize: '0.82rem',
                      width: '100%',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>View Dashboard</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Core Entrepreneur Workflow Map (8 Stages) */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Layers size={20} color="#38bdf8" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Integrated End-to-End Entrepreneur Journey
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {WORKFLOW_STAGES.map((stage, index) => (
            <Link
              key={stage.id}
              href={stage.url}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                {index + 1}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                  {stage.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {stage.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Architectural Separation Principles */}
      <section className="glass-panel" style={{ padding: '2.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#f8fafc' }}>
          System Architectural Trust & Separation
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} color="#34d399" />
              <h3 style={{ color: '#34d399', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Deterministic Rule & Financial Engine
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Eligibility decisions and mathematical financial calculations (subsidies, margin money, project cost, amortization EMI) are calculated deterministically in code—never left to generative AI.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={18} color="#c084fc" />
              <h3 style={{ color: '#c084fc', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Grounded AI Explanations (Gemini API)
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Google Gemini is strictly utilized for plain-language eligibility reasoning, conversational guidance, scheme clause clarification, and multilingual synthesis grounded in verified data.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MapPin size={18} color="#38bdf8" />
              <h3 style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                PostGIS Geospatial Feasibility
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Location-aware eligibility and demographic feasibility analysis powering regional subsidies (NER, Special Category States, Aspirational Districts).
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
