'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  MapPin,
  Briefcase,
  IndianRupee,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { FeasibilityOutcome, FeasibilityInputContext } from '@/types';
import Link from 'next/link';

interface FeasibilitySummaryCardProps {
  outcome?: FeasibilityOutcome;
  headline: string;
  summaryNotes?: string | string[];
  context?: FeasibilityInputContext;
  disclaimer?: string;
  profileId?: number;
}

export const FeasibilitySummaryCard: React.FC<FeasibilitySummaryCardProps> = ({
  outcome = 'INSUFFICIENT_DATA',
  headline,
  summaryNotes = [],
  context = {},
  disclaimer = '',
  profileId,
}) => {
  const getOutcomeConfig = (out: FeasibilityOutcome) => {
    switch (out) {
      case 'FAVOURABLE':
        return {
          label: 'Favourable Ecosystem Match',
          sublabel: 'High alignment with industrial clusters, priority trade sectors, and standard financial norms.',
          badgeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          cardBorder: 'border-emerald-500/30',
          gradientBg: 'from-emerald-950/30 via-slate-900/60 to-slate-900/90',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          accentColor: 'text-emerald-400',
        };
      case 'CAUTION':
        return {
          label: 'Conditional / Caution Advised',
          sublabel: 'Viable enterprise concept with key actionable cautions (e.g. leverage, new trade, or documentation).',
          badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          cardBorder: 'border-amber-500/30',
          gradientBg: 'from-amber-950/25 via-slate-900/60 to-slate-900/90',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          accentColor: 'text-amber-400',
        };
      case 'HIGH_RISK':
        return {
          label: 'Elevated Feasibility Risk',
          sublabel: 'Significant financial leverage, debt service pressure, or adverse credit flags detected.',
          badgeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          cardBorder: 'border-rose-500/30',
          gradientBg: 'from-rose-950/25 via-slate-900/60 to-slate-900/90',
          icon: <AlertOctagon className="w-6 h-6 text-rose-400" />,
          accentColor: 'text-rose-400',
        };
      case 'INSUFFICIENT_DATA':
      default:
        return {
          label: 'Insufficient Profile Information',
          sublabel: 'Key profile parameters (location, stage, or investment size) required to compute grounded signals.',
          badgeBg: 'bg-slate-500/15 border-slate-500/40 text-slate-300',
          cardBorder: 'border-slate-700',
          gradientBg: 'from-slate-800/30 via-slate-900/60 to-slate-900/90',
          icon: <HelpCircle className="w-6 h-6 text-slate-400" />,
          accentColor: 'text-slate-400',
        };
    }
  };

  const config = getOutcomeConfig(outcome);
  const notesArray = Array.isArray(summaryNotes)
    ? summaryNotes
    : typeof summaryNotes === 'string' && summaryNotes
    ? [summaryNotes]
    : [];

  const projectCostVal =
    context.project_cost ||
    context.required_loan_amount ||
    context.loan_requirement ||
    context.annual_turnover;

  return (
    <div
      className={`rounded-2xl border ${config.cardBorder} bg-gradient-to-br ${config.gradientBg} p-6 sm:p-8 backdrop-blur-xl shadow-xl transition-all`}
    >
      {/* Top row: Outcome badge + Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 shadow-inner">
            {config.icon}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deterministic Feasibility Assessment
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-3 py-0.5 text-xs font-bold rounded-full border ${config.badgeBg}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        {profileId && (
          <div className="flex items-center gap-2">
            <Link
              href={`/schemes?profile_id=${profileId}`}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              Explore Matched Schemes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Headline & Notes */}
      <div className="my-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug mb-3">
          {headline}
        </h2>
        <p className="text-xs text-slate-400 mb-4">{config.sublabel}</p>

        {notesArray.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {notesArray.map((note, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className={`${config.accentColor} font-bold mt-0.5`}>•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Parameters Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-slate-400" /> Sector / Trade
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {context.sector || 'Not specified'}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" /> Location
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {context.district ? `${context.district}, ${context.state || ''}` : 'Not specified'}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-slate-400" /> Stage
          </div>
          <div className="text-xs font-semibold text-slate-200 capitalize mt-0.5">
            {context.business_stage ? context.business_stage.toLowerCase() : 'Not specified'}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-slate-400" /> Project Cost
          </div>
          <div className="text-xs font-semibold text-emerald-300 mt-0.5">
            {projectCostVal
              ? `₹${(Number(projectCostVal) / 100000).toFixed(1)} Lakhs`
              : 'Not specified'}
          </div>
        </div>
      </div>

      {/* Regulatory Non-Guarantee Disclaimer */}
      {disclaimer && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
          <ShieldAlert className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">{disclaimer}</p>
        </div>
      )}
    </div>
  );
};
