'use client';

import React from 'react';
import { CitationSource } from '@/types';
import { ExternalLink, BookOpen, ShieldCheck } from 'lucide-react';

interface SourceCitationCardProps {
  source: CitationSource;
  className?: string;
}

export const SourceCitationCard: React.FC<SourceCitationCardProps> = ({ source, className = '' }) => {
  return (
    <div
      className={`p-3 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-indigo-300 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <h5 className="text-xs font-bold text-slate-800 leading-tight">
              {source.source_name}
            </h5>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="w-3 h-3" />
                {source.source_type || 'OFFICIAL_GUIDELINE'}
              </span>
              {source.section_type && (
                <span className="text-slate-400">• Section: {source.section_type.replace('_', ' ')}</span>
              )}
              {source.last_verified_at && (
                <span className="text-slate-400">
                  • Verified: {new Date(source.last_verified_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {source.official_url && (
          <a
            href={source.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors shrink-0"
            title="Open official government source"
          >
            <span>View Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
