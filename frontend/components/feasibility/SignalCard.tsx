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
          icon: <MapPin className="w-4 h-4 text-emerald-600" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-800',
        };
      case 'SECTOR_SIGNAL':
        return {
          label: 'Sector & Trade Fit',
          icon: <Layers className="w-4 h-4 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
        };
      case 'BUSINESS_STAGE_SIGNAL':
        return {
          label: 'Stage & Readiness',
          icon: <Compass className="w-4 h-4 text-purple-600" />,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
        };
      case 'FINANCIAL_FEASIBILITY_SIGNAL':
        return {
          label: 'Financial Feasibility',
          icon: <IndianRupee className="w-4 h-4 text-amber-600" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
        };
      case 'DATA_COMPLETENESS_SIGNAL':
        return {
          label: 'Data Completeness',
          icon: <FileQuestion className="w-4 h-4 text-sky-600" />,
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-200',
          textColor: 'text-sky-800',
        };
      case 'RISK_SIGNAL':
      default:
        return {
          label: 'Risk & Caution Factor',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          textColor: 'text-rose-800',
        };
    }
  };

  const getConfidenceBadge = (status: DataConfidenceStatus) => {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'Verified Gov Data',
          icon: <ShieldCheck className="w-3 h-3 text-emerald-600" />,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'ESTIMATED':
        return {
          label: 'Estimated Benchmark',
          icon: <Info className="w-3 h-3 text-blue-600" />,
          classes: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'UNVERIFIED':
        return {
          label: 'Self-Reported',
          icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'INSUFFICIENT_DATA':
      default:
        return {
          label: 'Insufficient Data',
          icon: <HelpCircle className="w-3 h-3 text-slate-500" />,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const catConfig = getCategoryConfig(category);
  const confBadge = getConfidenceBadge(confidenceStatus);

  return (
    <div
      className={`rounded-xl border p-4 bg-white transition-all shadow-xs ${
        isRisk
          ? 'border-rose-200 hover:border-rose-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${catConfig.bgColor} border ${catConfig.borderColor}`}>
            {catConfig.icon}
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${catConfig.textColor}`}>
            {catConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRisk && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" /> Risk Flag
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${confBadge.classes}`}
          >
            {confBadge.icon}
            {confBadge.label}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-bold text-slate-900 mb-1">{signal.title}</h4>

      {description && (
        <p className="text-xs text-slate-600 leading-relaxed mb-3 font-medium">{description}</p>
      )}

      {evidenceNotes.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Evidence & Grounds:
          </div>
          {evidenceNotes.map((note: string, idx: number) => (
            <div key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
              <span className="text-slate-400 mt-0.5 font-bold">•</span>
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}

      {(signal as any).data_source && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="truncate">Source: {(signal as any).data_source}</span>
          {(signal as any).source_url && (
            <a
              href={(signal as any).source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-0.5 shrink-0 font-semibold"
            >
              Verify <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default SignalCard;
