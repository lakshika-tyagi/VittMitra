'use client';

import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Send,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { ApplicationStatus, StatusSourceType, Application } from '@/types';

interface StatusUpdateModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (status: ApplicationStatus, note?: string) => Promise<void>;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  application,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(application.current_status);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const statuses: { value: ApplicationStatus; label: string; desc: string }[] = [
    { value: 'APPLICATION_STARTED', label: 'Application Started', desc: 'Pre-application preparation in progress' },
    { value: 'SUBMITTED', label: 'Submitted', desc: 'Application filed with official portal or bank' },
    { value: 'UNDER_REVIEW', label: 'Under Review / Scrutiny', desc: 'Task force or credit officer is examining documents' },
    { value: 'ADDITIONAL_INFORMATION_REQUIRED', label: 'Additional Info Required', desc: 'Reviewing authority requested more documents' },
    { value: 'APPROVED', label: 'Approved / Sanctioned', desc: 'Official sanction or subsidy approval granted' },
    { value: 'REJECTED', label: 'Rejected', desc: 'Application was rejected by authority or bank' },
    { value: 'COMPLETED', label: 'Completed / Disbursed', desc: 'Loan and subsidy disbursement completed' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdate(selectedStatus, note.trim() || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update application status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Update Application Status
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {application.scheme_name} ({application.application_reference_number || 'No Ref'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              New Status Stage
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {statuses.map((st) => (
                <label
                  key={st.value}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedStatus === st.value
                      ? 'border-emerald-600 bg-emerald-50 text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={st.value}
                    checked={selectedStatus === st.value}
                    onChange={() => setSelectedStatus(st.value)}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{st.label}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{st.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Status Notes / Action Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Received acknowledgement email from DIC Pune; interview scheduled on Monday."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 resize-none font-medium"
            />
          </div>

          {/* Non-guarantee note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              All status updates are recorded by you for workflow tracking. Official sanctions are issued solely by the government authority or bank.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Record Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
