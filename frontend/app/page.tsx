'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchHealth } from '@/services/api';
import { SystemHealthResponse } from '@/types';
import { CheckCircle2, CircleDot, Server, Cpu, Database, Layers, ArrowRight, ShieldCheck } from 'lucide-react';

const WORKFLOW_STAGES = [
  'Profile',
  'Business & Location Analysis',
  'Business Feasibility',
  'Financial Structuring',
  'Scheme Matching',
  'Eligibility Explanation',
  'Scheme Comparison',
  'Best-Fit Scheme',
  'Channel Partner',
  'Application',
  'Tracking',
  'Post-Loan AI Copilot',
];

export default function Home() {
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

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>
              VittMitra <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>(वित्तमित्र)</span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              AI-Driven Scheme Matching for Marginalized Entrepreneurs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/schemes" style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 600 }}>
            Schemes Discovery
          </Link>
          <Link href="/feasibility" style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
            Location Feasibility
          </Link>
          <Link href="/onboarding" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Onboarding
          </Link>
          <div className="badge badge-emerald">
            <CircleDot size={12} />
            <span>Step 9: Business & Location Feasibility Active</span>
          </div>
        </div>
      </header>

      {/* Hero / Platform Overview */}
      <section className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-blue">Explainable Scheme Matching & Feasibility Engine</span>
        </div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
          Intelligent Government Scheme Discovery & <span className="gradient-text">Business Feasibility Engine</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '800px', lineHeight: 1.6, marginBottom: '2rem' }}>
          VittMitra bridges the critical gap between marginalized entrepreneurs and verified government schemes. Built on deterministic rule evaluation, PostGIS geospatial feasibility, financial structuring, and grounded decision support.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link href="/schemes" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            Discover Schemes For You →
          </Link>
          <Link href="/feasibility" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
            Check Location Feasibility →
          </Link>
          <Link href="/onboarding" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            Start Entrepreneur Onboarding
          </Link>
        </div>

        {/* System Health Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Server size={16} color="#38bdf8" />
              <span>Next.js Frontend</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Online (v14.2 App Router)</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Cpu size={16} color="#34d399" />
              <span>FastAPI Backend API</span>
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
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {loading ? 'Checking API...' : health?.status === 'healthy' ? 'Connected (Port 8000)' : 'Awaiting Service'}
              </strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Database size={16} color="#818cf8" />
              <span>Database Engine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>PostgreSQL + PostGIS (Ready)</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Core Entrepreneur Workflow Map */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Layers size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Core Entrepreneur Workflow (11 Stages)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCompleted = index <= 6; // Stages 1 to 7 are completed
            return (
              <div
                key={index}
                style={{
                  background: isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(17, 24, 39, 0.6)',
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: isCompleted ? '#34d399' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    border: isCompleted ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-subtle)',
                  }}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architectural Separation Principles */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          System Architectural Pillars
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ color: '#34d399', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Deterministic Rule & Financial Engine
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Eligibility decisions and mathematical financial calculations (subsidies, margin money, project cost, amortization EMI) are calculated deterministically in code—never left to generative AI.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#38bdf8', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Grounded AI Explanations (Gemini API)
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Google Gemini is strictly utilized for plain-language eligibility reasoning, conversational guidance, scheme clause clarification, and multilingual synthesis grounded in verified data.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#818cf8', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              PostGIS Geospatial Feasibility
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Location-aware eligibility and demographic feasibility analysis powering regional subsidies (NER, Special Category States, Aspirational Districts).
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
