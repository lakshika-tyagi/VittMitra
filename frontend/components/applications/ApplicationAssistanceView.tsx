'use client';

import React, { useState } from 'react';
import {
  FileText,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Send,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ApplicationAssistance,
  SchemePartner,
  ChannelPartner,
  ApplicationCreatePayload,
} from '@/types';
import { DocumentChecklistInteractive } from './DocumentChecklistInteractive';
import { PartnerList } from '../partners/PartnerList';

interface ApplicationAssistanceViewProps {
  assistance: ApplicationAssistance;
  entrepreneurId: number;
  onApplicationCreated?: (appId: number) => void;
  onCreateApplication: (payload: ApplicationCreatePayload) => Promise<any>;
}

export const ApplicationAssistanceView: React.FC<ApplicationAssistanceViewProps> = ({
  assistance,
  entrepreneurId,
  onApplicationCreated,
  onCreateApplication,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    assistance.recommended_partners.length > 0 ? assistance.recommended_partners[0].id : null
  );
  const [refNumber, setRefNumber] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInitiateForm, setShowInitiateForm] = useState<boolean>(true);

  const handlePartnerSelect = (partner: SchemePartner | ChannelPartner) => {
    setSelectedPartnerId(partner.id);
  };

  const handleInitiateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: ApplicationCreatePayload = {
        entrepreneur_id: entrepreneurId,
        scheme_id: assistance.scheme_id,
        channel_partner_id: selectedPartnerId,
        application_reference_number: refNumber.trim() || undefined,
        initial_status: 'APPLICATION_STARTED',
        status_note: statusNote.trim() || 'Initiated application preparation via VittMitra assistance package',
        target_loan_amount: assistance.loan_requirement ? Number(assistance.loan_requirement) : undefined,
        target_subsidy_amount: assistance.estimated_subsidy_amount ? Number(assistance.estimated_subsidy_amount) : undefined,
        official_portal_url: assistance.official_portal_url || undefined,
      };

      const result = await onCreateApplication(payload);
      setSuccessMessage('Application successfully recorded in your VittMitra tracker!');
      if (onApplicationCreated && result?.id) {
        onApplicationCreated(result.id);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPartner = assistance.recommended_partners.find(
    (p) => p.id === selectedPartnerId
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Scheme & Eligibility Overview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-mono">
                {assistance.scheme_code}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  assistance.eligibility_status === 'MATCHED'
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60'
                    : assistance.eligibility_status === 'UNVERIFIED'
                    ? 'bg-amber-950/50 text-amber-300 border-amber-700/60'
                    : 'bg-rose-950/50 text-rose-300 border-rose-700/60'
                }`}
              >
                {assistance.eligibility_status === 'MATCHED'
                  ? '✓ Verified Eligible'
                  : assistance.eligibility_status === 'UNVERIFIED'
                  ? 'Criteria Unverified'
                  : 'Eligibility Mismatch'}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-100">
              How to Access: {assistance.scheme_name}
            </h2>
            {assistance.nodal_ministry && (
              <p className="text-xs text-slate-400">
                Nodal Authority: <span className="text-slate-300">{assistance.nodal_ministry}</span>
              </p>
            )}
          </div>

          {assistance.official_portal_url && (
            <a
              href={assistance.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors shrink-0"
            >
              Official Ministry Portal
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          )}
        </div>

        {/* Financial & Guidance Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Est. Project Cost</span>
            <span className="font-bold text-slate-200">
              {assistance.project_cost
                ? `₹${Number(assistance.project_cost).toLocaleString('en-IN')}`
                : 'Not specified'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Own Equity</span>
            <span className="font-bold text-slate-200">
              {assistance.own_contribution
                ? `₹${Number(assistance.own_contribution).toLocaleString('en-IN')}`
                : 'Not specified'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Loan Requirement</span>
            <span className="font-bold text-emerald-400">
              {assistance.loan_requirement
                ? `₹${Number(assistance.loan_requirement).toLocaleString('en-IN')}`
                : 'Not specified'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Est. Govt Subsidy</span>
            <span className="font-bold text-cyan-400">
              {assistance.estimated_subsidy_amount
                ? `₹${Number(assistance.estimated_subsidy_amount).toLocaleString('en-IN')}`
                : 'Not applicable'}
            </span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Guidance Instructions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          <span>Step-by-Step Application Roadmap</span>
        </h4>
        <div className="space-y-2.5">
          {assistance.application_steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Documents Checklist */}
      <DocumentChecklistInteractive documents={assistance.required_documents} />

      {/* Recommended Channel Partners */}
      <div className="space-y-3">
        <PartnerList
          partners={assistance.recommended_partners}
          selectedPartnerId={selectedPartnerId}
          onSelectPartner={handlePartnerSelect}
          title="Recommended Verified Channel Partners"
          subtitle="Select your preferred partner to link with this application"
        />
      </div>

      {/* Record Application in Tracker Form */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-6 space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowInitiateForm(!showInitiateForm)}
        >
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">
              Track This Application in VittMitra
            </h3>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-200">
            {showInitiateForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showInitiateForm && (
          <form onSubmit={handleInitiateApplication} className="space-y-4 pt-2">
            <p className="text-xs text-slate-300">
              Record your scheme application in VittMitra to maintain an audit trail, log status updates, and track follow-up milestones.
            </p>

            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-600 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Selected Channel Partner
                </label>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200">
                  {selectedPartner ? (
                    <span className="font-semibold">{selectedPartner.organization_name}</span>
                  ) : (
                    <span className="text-slate-500">None selected (Direct / Portal)</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Application / Acknowledgment Ref # (Optional)
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. PMEGP/2026/MH/00192"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Initial Preparation Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Assembled DPR and Aadhaar; planning to visit DIC Shivajinagar on Tuesday."
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Recording Application...' : 'Record & Start Tracking'}
            </button>
          </form>
        )}
      </div>

      {/* Regulatory Non-Guarantee Disclaimer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>Statutory & Non-Guarantee Disclaimer</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {assistance.disclaimer}
        </p>
      </div>
    </div>
  );
};
