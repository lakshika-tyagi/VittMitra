'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface RiskCautionSectionProps {
  positiveDrivers: string[];
  riskFlags: string[];
  missingFields: string[];
  actionableRecommendations: string[];
  profileId?: number;
}

export const RiskCautionSection: React.FC<RiskCautionSectionProps> = ({
  positiveDrivers,
  riskFlags,
  missingFields,
  actionableRecommendations,
  profileId,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Positive Drivers */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-md p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-emerald-300">
              Positive Feasibility Drivers ({positiveDrivers.length})
            </h4>
          </div>
          {positiveDrivers.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No strong positive drivers detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {positiveDrivers.map((driver, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 2. Risk & Caution Flags */}
      <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 backdrop-blur-md p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-rose-300">
              Risk & Caution Flags ({riskFlags.length})
            </h4>
          </div>
          {riskFlags.length === 0 ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No critical credit or operational risk flags detected.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {riskFlags.map((risk, idx) => (
                <li key={idx} className="text-xs text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Actionable Next Steps */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 backdrop-blur-md p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-indigo-300">
              Actionable Recommendations ({actionableRecommendations.length})
            </h4>
          </div>
          {actionableRecommendations.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No specific recommendations at this time.</p>
          ) : (
            <ol className="space-y-2">
              {actionableRecommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* 4. Missing Information Prompt */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 backdrop-blur-md p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <FileQuestion className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-cyan-300">
              Missing Data Fields ({missingFields.length})
            </h4>
          </div>
          {missingFields.length === 0 ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All key profile, financial, and location fields are provided!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                Providing these fields will unlock higher-confidence feasibility matching:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {missingFields.length > 0 && profileId && (
          <div className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-end">
            <Link
              href={`/onboarding?edit=true&profile_id=${profileId}`}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 flex items-center gap-1 hover:underline"
            >
              Complete Profile Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
