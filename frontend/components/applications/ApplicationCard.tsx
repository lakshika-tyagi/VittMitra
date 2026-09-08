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
        return { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'APPLICATION_STARTED':
        return { label: 'In Progress', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'SUBMITTED':
        return { label: 'Submitted', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'UNDER_REVIEW':
        return { label: 'Under Review', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return { label: 'Action Required', bg: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'APPROVED':
        return { label: 'Approved', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'REJECTED':
        return { label: 'Rejected', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'COMPLETED':
        return { label: 'Disbursed', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300' };
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
      className={`rounded-xl border transition-all duration-200 p-5 space-y-4 bg-white ${
        isSelected
          ? 'border-emerald-600 shadow-md shadow-emerald-500/10'
          : 'border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
              {badge.label}
            </span>
            {application.application_reference_number && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                Ref: {application.application_reference_number}
              </span>
            )}
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
              {application.source_type || 'USER_RECORDED'}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900">
            {application.scheme_name}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {application.nodal_ministry || 'Government Scheme'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenStatusModal && (
            <button
              type="button"
              onClick={() => onOpenStatusModal(application)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              Update Status
            </button>
          )}
          {onViewDetail && (
            <button
              type="button"
              onClick={() => onViewDetail(application)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Timeline
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Financial & Partner Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <div>
          <span className="text-[11px] text-slate-500 font-bold block">Target Loan</span>
          <span className="font-extrabold text-slate-900">
            {application.target_loan_amount
              ? `₹${Number(application.target_loan_amount).toLocaleString('en-IN')}`
              : 'Not specified'}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-bold block">Channel Partner</span>
          <span className="font-semibold text-slate-800 truncate block">
            {application.partner_name || 'Direct / Portal'}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-bold block">Initiated Date</span>
          <span className="font-mono text-slate-700 font-semibold">
            {formatDate(application.application_date || application.created_at)}
          </span>
        </div>
      </div>

      {/* Next Recommended Action */}
      {application.next_recommended_action && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-emerald-600" />
            Next Recommended Action
          </span>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {application.next_recommended_action}
          </p>
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;
