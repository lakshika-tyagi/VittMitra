'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Briefcase,
  MapPin,
  IndianRupee,
  Layers,
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
          badgeBg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          cardBorder: 'border-emerald-200',
          gradientBg: 'from-emerald-50/70 via-white to-white',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          accentColor: 'text-emerald-700',
        };
      case 'CAUTION':
        return {
          label: 'Conditional / Caution Advised',
          sublabel: 'Viable enterprise concept with key actionable cautions (e.g. leverage, new trade, or documentation).',
          badgeBg: 'bg-amber-50 border-amber-300 text-amber-800',
          cardBorder: 'border-amber-200',
          gradientBg: 'from-amber-50/70 via-white to-white',
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          accentColor: 'text-amber-700',
        };
      case 'HIGH_RISK':
        return {
          label: 'Elevated Feasibility Risk',
          sublabel: 'Significant financial leverage, debt service pressure, or adverse credit flags detected.',
          badgeBg: 'bg-rose-50 border-rose-300 text-rose-800',
          cardBorder: 'border-rose-200',
          gradientBg: 'from-rose-50/70 via-white to-white',
          icon: <AlertOctagon className="w-6 h-6 text-rose-600" />,
          accentColor: 'text-rose-700',
        };
      case 'INSUFFICIENT_DATA':
      default:
        return {
          label: 'Insufficient Profile Information',
          sublabel: 'Key profile parameters (location, stage, or investment size) required to compute grounded signals.',
          badgeBg: 'bg-slate-100 border-slate-300 text-slate-800',
          cardBorder: 'border-slate-200',
          gradientBg: 'from-slate-50 via-white to-white',
          icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
          accentColor: 'text-slate-700',
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
      className={`rounded-2xl border ${config.cardBorder} bg-gradient-to-br ${config.gradientBg} p-6 sm:p-8 shadow-sm transition-all`}
    >
      {/* Top row: Outcome badge + Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            {config.icon}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Explore Matched Schemes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Headline & Notes */}
      <div className="my-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug mb-2">
          {headline}
        </h2>
        <p className="text-xs text-slate-600 mb-4 font-medium">{config.sublabel}</p>

        {notesArray.length > 0 && (
          <div className="space-y-2 pt-2">
            {notesArray.map((note, idx) => (
              <div key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                <span className={`${config.accentColor} font-bold mt-0.5`}>•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Parameters Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-slate-400" /> Sector / Trade
          </div>
          <div className="text-xs font-bold text-slate-900 truncate mt-0.5 capitalize">
            {context.sector?.replace('_', ' ') || 'Not specified'}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" /> Location
          </div>
          <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
            {context.district && context.state
              ? `${context.district}, ${context.state}`
              : context.district || context.state || 'Not specified'}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" /> Stage
          </div>
          <div className="text-xs font-bold text-slate-900 truncate mt-0.5 capitalize">
            {context.business_stage?.replace('_', ' ') || 'New Enterprise'}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 uppercase font-bold flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-slate-400" /> Project Cost
          </div>
          <div className="text-xs font-bold text-emerald-700 truncate mt-0.5">
            {projectCostVal
              ? `₹${(Number(projectCostVal) / 100000).toLocaleString('en-IN')} Lakhs`
              : 'Not specified'}
          </div>
        </div>
      </div>

      {/* Non-Guarantee Feasibility Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-500">
        <HelpCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p>{disclaimer || 'Feasibility analysis is an explainable decision-support indicator and does not guarantee business success, profitability, demand, loan approval, or scheme approval.'}</p>
      </div>
    </div>
  );
};

export default FeasibilitySummaryCard;
