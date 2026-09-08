'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  User,
  ShieldAlert,
} from 'lucide-react';
import {
  ApplicationCard,
  ApplicationTimeline,
  StatusUpdateModal,
} from '@/components/applications';
import { PartnerCard } from '@/components/partners';
import {
  listApplications,
  getApplicationDetail,
  updateApplicationStatus,
} from '@/services/api';
import {
  Application,
  ApplicationStatus,
} from '@/types';
import { useProfile } from '@/hooks/useProfile';

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const profileIdParam = searchParams.get('profile_id');

  const { activeProfileId, availableProfiles, setActiveProfileId } = useProfile();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected application for detail timeline view
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Status update modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalApp, setModalApp] = useState<Application | null>(null);

  // Load applications for current profile
  const loadApps = async () => {
    if (!activeProfileId) {
      setApplications([]);
      setSelectedAppId(null);
      setSelectedAppDetail(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const apps = await listApplications(activeProfileId);
      setApplications(apps);

      if (apps.length > 0 && (!selectedAppId || !apps.some((a) => a.id === selectedAppId))) {
        setSelectedAppId(apps[0].id);
      } else if (apps.length === 0) {
        setSelectedAppId(null);
        setSelectedAppDetail(null);
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      setError(err?.message || 'Could not load your applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, [activeProfileId]);

  // Load detailed timeline whenever selectedAppId changes
  useEffect(() => {
    if (!selectedAppId) {
      setSelectedAppDetail(null);
      return;
    }

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const detail = await getApplicationDetail(selectedAppId);
        setSelectedAppDetail(detail);
      } catch (err) {
        console.error('Failed to load application detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetail();
  }, [selectedAppId]);

  const handleStatusUpdate = async (newStatus: ApplicationStatus, note?: string) => {
    if (!modalApp) return;
    await updateApplicationStatus(modalApp.id, {
      status: newStatus,
      status_note: note,
      source_type: 'USER_RECORDED',
    });
    await loadApps();
    if (selectedAppId === modalApp.id) {
      const refreshed = await getApplicationDetail(modalApp.id);
      setSelectedAppDetail(refreshed);
    }
  };

  const handleProfileChange = (pId: number) => {
    setActiveProfileId(pId);
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.current_status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchScheme = app.scheme_name.toLowerCase().includes(q);
      const matchRef = app.application_reference_number?.toLowerCase().includes(q);
      const matchPartner = app.partner_name?.toLowerCase().includes(q);
      if (!matchScheme && !matchRef && !matchPartner) return false;
    }
    return true;
  });

  // Metrics
  const totalCount = applications.length;
  const startedCount = applications.filter((a) => a.current_status === 'APPLICATION_STARTED').length;
  const inReviewCount = applications.filter((a) => ['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'].includes(a.current_status)).length;
  const approvedCount = applications.filter((a) => ['APPROVED', 'COMPLETED'].includes(a.current_status)).length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Link href="/" style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
              ← Dashboard
            </Link>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 700 }}>Applications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scheme Applications & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Audit-grade lifecycle tracking with verified channel partner guidance and status history.
          </p>
        </div>

        {/* Profile Switcher & New App CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          {availableProfiles.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeProfileId || ''}
                onChange={(e) => handleProfileChange(Number(e.target.value))}
                className="bg-transparent border-none text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                {availableProfiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white text-slate-900">
                    {p.full_name} ({p.district || 'All Districts'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href="/schemes"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Track New Scheme
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-bold">Total Applications</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-bold">In Preparation</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{startedCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-bold">Submitted / Under Review</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{inReviewCount}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-bold">Approved / Sanctioned</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{approvedCount}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your recorded applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-4 shadow-xs">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Applications Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              Explore best-fit government schemes matched to your profile, generate your pre-application guidance package, and start tracking your journey.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/schemes"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-2 shadow-sm"
            >
              Explore Schemes For You
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Applications List & Search */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scheme or reference..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 font-bold focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">All Stages</option>
                <option value="APPLICATION_STARTED">In Progress</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredApps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  isSelected={selectedAppId === app.id}
                  onViewDetail={() => setSelectedAppId(app.id)}
                  onOpenStatusModal={(a) => {
                    setModalApp(a);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right Column (7 Cols): Selected Application Timeline & Channel Partner */}
          <div className="lg:col-span-7 space-y-5">
            {detailLoading ? (
              <div className="p-8 rounded-xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Loading timeline...</p>
              </div>
            ) : selectedAppDetail ? (
              <div className="space-y-5">
                {/* Header Card with Quick Update */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {selectedAppDetail.scheme_code}
                        </span>
                        {selectedAppDetail.application_reference_number && (
                          <span className="font-mono text-xs text-slate-500 font-semibold">
                            Ref: {selectedAppDetail.application_reference_number}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedAppDetail.scheme_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {selectedAppDetail.nodal_ministry || 'Nodal Ministry'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setModalApp(selectedAppDetail);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0 shadow-sm cursor-pointer"
                    >
                      Update Status
                    </button>
                  </div>

                  {/* Stage Explanation & Next Action */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Current Status Explanation
                      </span>
                      <p className="text-slate-800 mt-0.5 font-medium">
                        {selectedAppDetail.status_explanation}
                      </p>
                    </div>

                    {selectedAppDetail.next_recommended_action && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-emerald-600" />
                          Recommended Next Action
                        </span>
                        <p className="text-slate-700 mt-0.5 font-medium">
                          {selectedAppDetail.next_recommended_action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Channel Partner Card */}
                {selectedAppDetail.channel_partner && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Assigned Channel Partner / Branch
                    </h4>
                    <PartnerCard partner={selectedAppDetail.channel_partner} />
                  </div>
                )}

                {/* Timeline History */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <ApplicationTimeline
                    history={selectedAppDetail.status_history || []}
                    currentStatus={selectedAppDetail.current_status}
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-slate-200 bg-white text-center text-xs text-slate-500 font-medium shadow-xs">
                Select an application from the list to view its complete timeline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-guarantee Disclaimer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2 text-amber-700 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Statutory Provenance Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed font-medium">
          Application records in VittMitra represent applicant self-recorded timeline progress and facilitation milestones. VittMitra does not perform automated portal submissions or guarantee loan sanctions. Always refer to official government sanction letters and physical bank appraisal for authoritative status.
        </p>
      </div>

      {/* Status Update Modal */}
      {modalApp && (
        <StatusUpdateModal
          application={modalApp}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalApp(null);
          }}
          onUpdate={handleStatusUpdate}
        />
      )}
    </main>
  );
}

export default function ApplicationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading Applications Dashboard...</p>
          </div>
        </div>
      }
    >
      <ApplicationsContent />
    </React.Suspense>
  );
}
