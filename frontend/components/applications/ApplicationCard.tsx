'use client';

import React from 'react';
import {
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Application, ApplicationStatus } from '@/types';

interface ApplicationCardProps {
  application: Application;
  onOpenStatusModal?: (application: Application) => void;
  onViewDetail?: (application: Application) => void;
  isSelected?: boolean;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onOpenStatusModal,
  onViewDetail,
  isSelected,
}) => {
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Draft', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
      case 'APPLICATION_STARTED':
        return { label: 'In Progress', bg: 'bg-blue-950/60 text-blue-300 border-blue-800/60' };
      case 'SUBMITTED':
        return { label: 'Submitted', bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' };
      case 'UNDER_REVIEW':
        return { label: 'Under Review', bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60' };
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return { label: 'Action Required', bg: 'bg-orange-950/60 text-orange-300 border-orange-800/60' };
      case 'APPROVED':
        return { label: 'Approved', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60' };
      case 'REJECTED':
        return { label: 'Rejected', bg: 'bg-rose-950/60 text-rose-300 border-rose-800/60' };
      case 'COMPLETED':
        return { label: 'Disbursed', bg: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/60' };
      default:
        return { label: status, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getStatusBadge(application.current_status);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not recorded';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 p-5 space-y-4 ${
        isSelected
          ? 'border-emerald-500 bg-slate-900/90 shadow-lg shadow-emerald-950/20'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
              {badge.label}
            </span>
            {application.application_reference_number && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Ref: {application.application_reference_number}
              </span>
            )}
            <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
              {application.source_type || 'USER_RECORDED'}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-100">
            {application.scheme_name}
          </h4>
          <p className="text-xs text-slate-400">
            {application.nodal_ministry || 'Government Scheme'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenStatusModal && (
            <button
              type="button"
              onClick={() => onOpenStatusModal(application)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Update Status
            </button>
          )}
          {onViewDetail && (
            <button
              type="button"
              onClick={() => onViewDetail(application)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1"
            >
              Timeline
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Financial & Partner Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
        <div>
          <span className="text-[11px] text-slate-500 block">Target Loan</span>
          <span className="font-bold text-slate-200">
            {application.target_loan_amount
              ? `₹${Number(application.target_loan_amount).toLocaleString('en-IN')}`
              : 'Not specified'}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Channel Partner</span>
          <span className="font-semibold text-slate-300 truncate block">
            {application.partner_name || 'Direct / Portal'}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Initiated Date</span>
          <span className="font-mono text-slate-400">
            {formatDate(application.application_date || application.created_at)}
          </span>
        </div>
      </div>

      {/* Next Recommended Action */}
      {application.next_recommended_action && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Next Recommended Action
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {application.next_recommended_action}
          </p>
        </div>
      )}

      {/* Status Note */}
      {application.status_note && (
        <p className="text-xs text-slate-400 italic">
          "{application.status_note}"
        </p>
      )}
    </div>
  );
};
