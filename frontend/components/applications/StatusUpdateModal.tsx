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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Update Application Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {application.scheme_name} ({application.application_reference_number || 'No Ref'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              New Status Stage
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {statuses.map((st) => (
                <label
                  key={st.value}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedStatus === st.value
                      ? 'border-emerald-500 bg-emerald-950/20 text-slate-100'
                      : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={st.value}
                    checked={selectedStatus === st.value}
                    onChange={() => setSelectedStatus(st.value)}
                    className="mt-1 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold">{st.label}</div>
                    <div className="text-[11px] text-slate-400">{st.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Status Notes / Action Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Received acknowledgement email from DIC Pune; interview scheduled on Monday."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Non-guarantee note */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              All status updates are recorded by you for workflow tracking. Official sanctions are issued solely by the government authority or bank.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Save Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
