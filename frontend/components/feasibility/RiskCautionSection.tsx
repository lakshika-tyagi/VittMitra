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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">
              Positive Feasibility Drivers ({positiveDrivers.length})
            </h4>
          </div>
          {positiveDrivers.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No strong positive drivers detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {positiveDrivers.map((driver, idx) => (
                <li key={idx} className="text-xs text-slate-800 font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 2. Risk & Caution Flags */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-rose-900">
              Risk & Caution Flags ({riskFlags.length})
            </h4>
          </div>
          {riskFlags.length === 0 ? (
            <div className="p-3 rounded-lg bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>No critical credit or operational risk flags detected.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {riskFlags.map((risk, idx) => (
                <li key={idx} className="text-xs text-slate-800 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Actionable Next Steps */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-indigo-900">
              Actionable Recommendations ({actionableRecommendations.length})
            </h4>
          </div>
          {actionableRecommendations.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No specific recommendations at this time.</p>
          ) : (
            <ul className="space-y-2">
              {actionableRecommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-800 font-medium flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 4. Missing Information Prompt */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <FileQuestion className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-amber-900">
              Unverified / Missing Fields ({missingFields.length})
            </h4>
          </div>
          {missingFields.length === 0 ? (
            <div className="p-3 rounded-lg bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Full profile provided. All feasibility signals evaluated.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-700 font-medium">
                Completing these fields in onboarding will generate higher-confidence signals:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-amber-800 border border-amber-300 capitalize"
                  >
                    {field.replace('_', ' ')}
                  </span>
                ))}
              </div>
              {profileId && (
                <div className="pt-2">
                  <Link
                    href={`/onboarding?edit=true&profile_id=${profileId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-700 underline"
                  >
                    Update Profile Fields <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskCautionSection;
