'use client';

import React, { useState } from 'react';
import { GroundedChatResponse } from '@/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceCitationCard } from './SourceCitationCard';
import { Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface AIExplanationCardProps {
  explanation: GroundedChatResponse;
  title?: string;
  onAskFollowUp?: (question: string) => void;
  className?: string;
}

export const AIExplanationCard: React.FC<AIExplanationCardProps> = ({
  explanation,
  title = 'AI Grounded Analysis & Explanation',
  onAskFollowUp,
  className = '',
}) => {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`p-5 bg-linear-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100 rounded-xl shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-100/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        </div>
        <ConfidenceBadge confidence={explanation.confidence} />
      </div>

      {/* Answer Body */}
      <div className="mt-3.5 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
        {explanation.answer}
      </div>

      {/* Suggested Actions */}
      {explanation.suggested_actions && explanation.suggested_actions.length > 0 && (
        <div className="mt-4 p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
          <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Recommended Next Steps:
          </h5>
          <ul className="space-y-1.5 text-xs text-emerald-900">
            {explanation.suggested_actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limitations / Caveats */}
      {explanation.limitations && explanation.limitations.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
          <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Important Context & Limitations:
          </h5>
          <ul className="space-y-1 text-xs text-amber-900">
            {explanation.limitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citations Accordion */}
      {explanation.sources && explanation.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowSources(!showSources)}
            className="flex items-center justify-between w-full text-xs font-semibold text-indigo-700 hover:text-indigo-900 py-1 transition-colors"
          >
            <span>Verified Sources & Gazette References ({explanation.sources.length})</span>
            {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSources && (
            <div className="mt-2.5 space-y-2">
              {explanation.sources.map((src, idx) => (
                <SourceCitationCard key={idx} source={src} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statutory Disclaimer */}
      {explanation.disclaimer && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
          <span>{explanation.disclaimer}</span>
        </div>
      )}
    </div>
  );
};
