'use client';

import React from 'react';
import { HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface MissingInfoPromptProps {
  missingFields: string[];
  profileId?: number;
}

export const MissingInfoPrompt: React.FC<MissingInfoPromptProps> = ({
  missingFields,
  profileId,
}) => {
  if (!missingFields || missingFields.length === 0) return null;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-cyan-200">
              Complete Profile Inputs for Higher-Confidence Feasibility
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              VittMitra never estimates fake demand or generates black-box predictions. Providing these specific
              inputs allows our deterministic engine to evaluate verified spatial MSME clusters and debt service capacity:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {missingFields.map((field, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>

        {profileId && (
          <Link
            href={`/onboarding?edit=true&profile_id=${profileId}`}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-cyan-500/20"
          >
            Update Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
