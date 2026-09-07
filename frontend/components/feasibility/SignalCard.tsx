'use client';

import React from 'react';
import {
  MapPin,
  Layers,
  Compass,
  IndianRupee,
  FileQuestion,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Info,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { BusinessSignal, SignalCategory, DataConfidenceStatus } from '@/types';

interface SignalCardProps {
  signal: BusinessSignal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const category = signal.category || signal.signal_type;
  const confidenceStatus = signal.confidence_status || signal.status;
  const isRisk = signal.is_risk !== undefined ? signal.is_risk : !signal.is_positive;
  const description = signal.description || signal.interpretation || signal.explanation;
  const evidenceNotes = signal.evidence_notes || (signal.explanation ? [signal.explanation] : []);

  const getCategoryConfig = (cat: SignalCategory) => {
    switch (cat) {
      case 'LOCATION_SIGNAL':
        return {
          label: 'Location Ecosystem',
          icon: <MapPin className="w-4 h-4 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-300',
        };
      case 'SECTOR_SIGNAL':
        return {
          label: 'Sector & Trade Fit',
          icon: <Layers className="w-4 h-4 text-blue-400" />,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-300',
        };
      case 'BUSINESS_STAGE_SIGNAL':
        return {
          label: 'Stage & Readiness',
          icon: <Compass className="w-4 h-4 text-purple-400" />,
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
          textColor: 'text-purple-300',
        };
      case 'FINANCIAL_FEASIBILITY_SIGNAL':
        return {
          label: 'Financial Feasibility',
          icon: <IndianRupee className="w-4 h-4 text-amber-400" />,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-300',
        };
      case 'DATA_COMPLETENESS_SIGNAL':
        return {
          label: 'Data Completeness',
          icon: <FileQuestion className="w-4 h-4 text-cyan-400" />,
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/30',
          textColor: 'text-cyan-300',
        };
      case 'RISK_SIGNAL':
      default:
        return {
          label: 'Risk & Caution Factor',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/30',
          textColor: 'text-rose-300',
        };
    }
  };

  const getConfidenceBadge = (status: DataConfidenceStatus) => {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'Verified Gov Data',
          icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />,
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'ESTIMATED':
        return {
          label: 'Estimated Benchmark',
          icon: <Info className="w-3 h-3 text-blue-400" />,
          classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'UNVERIFIED':
        return {
          label: 'Self-Reported',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'INSUFFICIENT_DATA':
      default:
        return {
          label: 'Insufficient Data',
          icon: <HelpCircle className="w-3 h-3 text-slate-400" />,
          classes: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        };
    }
  };

  const catConfig = getCategoryConfig(category);
  const confBadge = getConfidenceBadge(confidenceStatus);

  return (
    <div
      className={`rounded-xl border p-4 bg-slate-900/60 backdrop-blur-md transition-all hover:bg-slate-900/80 ${
        isRisk
          ? 'border-rose-500/30 hover:border-rose-500/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${catConfig.bgColor} border ${catConfig.borderColor}`}>
            {catConfig.icon}
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider ${catConfig.textColor}`}>
            {catConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRisk && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Risk Flag
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1 ${confBadge.classes}`}
          >
            {confBadge.icon}
            {confBadge.label}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-100 mb-1">{signal.title}</h4>
      <p className="text-xs text-slate-300 leading-relaxed mb-3">{description}</p>

      {evidenceNotes && evidenceNotes.length > 0 && (
        <div className="mb-3 pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Key Grounded Evidence:
          </p>
          <ul className="space-y-1">
            {evidenceNotes.map((note: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {signal.source_name && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="truncate">
            Source:{' '}
            <strong className="text-slate-300 font-medium">
              {signal.source_name}
              {signal.source_version ? ` (${signal.source_version})` : ''}
            </strong>
          </span>
          {signal.source_url && (
            <a
              href={signal.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ml-2 flex-shrink-0"
            >
              Verify <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
