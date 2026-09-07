'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  ArrowRight,
  ShieldAlert,
  Send,
  HelpCircle,
} from 'lucide-react';
import { ApplicationStatusHistory, ApplicationStatus } from '@/types';

interface ApplicationTimelineProps {
  history: ApplicationStatusHistory[];
  currentStatus: ApplicationStatus;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  history,
  currentStatus,
}) => {
  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Draft Prepared', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' };
      case 'APPLICATION_STARTED':
        return { label: 'Application Initiated', color: 'text-blue-400', bg: 'bg-blue-950/60', border: 'border-blue-700' };
      case 'SUBMITTED':
        return { label: 'Submitted to Portal / Bank', color: 'text-indigo-400', bg: 'bg-indigo-950/60', border: 'border-indigo-700' };
      case 'UNDER_REVIEW':
        return { label: 'Under Review / Appraisal', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-700' };
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return { label: 'Additional Info Requested', color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-700' };
      case 'APPROVED':
        return { label: 'Approved / Sanctioned', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-600' };
      case 'REJECTED':
        return { label: 'Application Rejected', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-700' };
      case 'COMPLETED':
        return { label: 'Disbursed & Completed', color: 'text-emerald-300', bg: 'bg-emerald-900/60', border: 'border-emerald-500' };
      default:
        return { label: status, color: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700' };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Clock className="w-5 h-5 text-emerald-400" />
        <h4 className="text-sm font-semibold text-slate-100">
          Application Timeline & Status History
        </h4>
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">
          No timeline events recorded yet.
        </p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {history.map((item, idx) => {
            const meta = getStatusMeta(item.status);
            const isFirst = idx === 0;

            return (
              <div key={item.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                    meta.bg
                  } ${meta.border} ${isFirst ? 'ring-2 ring-emerald-500/30' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full ${meta.color.replace('text-', 'bg-')}`} />
                </div>

                {/* Event card */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5 ml-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(item.recorded_at)}
                    </span>
                  </div>

                  {item.status_note && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.status_note}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      Source: {item.source_type || 'USER_RECORDED'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
