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
        return { label: 'Draft Prepared', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' };
      case 'APPLICATION_STARTED':
        return { label: 'Application Initiated', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'SUBMITTED':
        return { label: 'Submitted to Portal / Bank', color: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      case 'UNDER_REVIEW':
        return { label: 'Under Review / Appraisal', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return { label: 'Additional Info Requested', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'APPROVED':
        return { label: 'Approved / Sanctioned', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'REJECTED':
        return { label: 'Application Rejected', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' };
      case 'COMPLETED':
        return { label: 'Disbursed & Completed', color: 'text-emerald-900', bg: 'bg-emerald-100', border: 'border-emerald-300' };
      default:
        return { label: status, color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300' };
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
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <Clock className="w-5 h-5 text-emerald-600" />
        <h4 className="text-sm font-bold text-slate-900">
          Application Timeline & Status History
        </h4>
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4 font-medium">
          No timeline events recorded yet.
        </p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {history.map((item, idx) => {
            const meta = getStatusMeta(item.status);
            const isFirst = idx === 0;

            return (
              <div key={item.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                    meta.bg
                  } ${meta.border} ${isFirst ? 'ring-2 ring-emerald-500/40' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full ${meta.color.replace('text-', 'bg-')}`} />
                </div>

                {/* Event card */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 ml-1 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">
                      {formatDate(item.recorded_at)}
                    </span>
                  </div>

                  {item.status_note && (
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.status_note}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200 font-medium">
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

export default ApplicationTimeline;
