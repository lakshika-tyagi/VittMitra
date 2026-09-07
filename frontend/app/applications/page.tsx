'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  PlusCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  User,
} from 'lucide-react';
import {
  listProfiles,
  listApplications,
  getApplicationDetail,
  updateApplicationStatus,
} from '@/services/api';
import {
  Entrepreneur,
  Application,
  ApplicationStatus,
  StatusSourceType,
} from '@/types';
import {
  ApplicationCard,
  ApplicationTimeline,
  StatusUpdateModal,
} from '@/components/applications';
import { PartnerCard } from '@/components/partners';

export default function ApplicationsTrackerPage() {
  const [profiles, setProfiles] = useState<Entrepreneur[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<Application | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [modalApp, setModalApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 1. Initial Load: Profiles
  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        setError(null);

        const profileList = await listProfiles();
        setProfiles(profileList);

        let activeId: number | null = null;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('vittmitra_active_profile_id');
          if (stored && !isNaN(Number(stored))) {
            activeId = Number(stored);
          }
        }

        if (!activeId && profileList.length > 0) {
          activeId = profileList[0].id;
        }

        if (activeId) {
          setSelectedProfileId(activeId);
        }
      } catch (err: any) {
        console.error('Failed to load profiles:', err);
        setError(err.message || 'Profiles could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, []);

  // 2. Load Applications when selectedProfileId changes
  useEffect(() => {
    if (!selectedProfileId) return;

    async function loadApps() {
      try {
        setLoading(true);
        setError(null);

        const apps = await listApplications(selectedProfileId!);
        setApplications(apps);

        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
        } else {
          setSelectedAppId(null);
          setSelectedAppDetail(null);
        }
      } catch (err: any) {
        console.error('Failed to load applications:', err);
        setError(err.message || 'Applications could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    loadApps();
  }, [selectedProfileId]);

  // 3. Load Application Detail when selectedAppId changes
  useEffect(() => {
    if (!selectedAppId) {
      setSelectedAppDetail(null);
      return;
    }

    async function loadDetail() {
      try {
        setDetailLoading(true);
        const detail = await getApplicationDetail(selectedAppId!);
        setSelectedAppDetail(detail);
      } catch (err: any) {
        console.error('Failed to load application detail:', err);
      } finally {
        setDetailLoading(false);
      }
    }

    loadDetail();
  }, [selectedAppId]);

  const handleProfileChange = (id: number) => {
    setSelectedProfileId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vittmitra_active_profile_id', id.toString());
    }
  };

  const handleStatusUpdate = async (newStatus: ApplicationStatus, note?: string) => {
    if (!modalApp) return;

    await updateApplicationStatus(modalApp.id, {
      status: newStatus,
      status_note: note,
      source_type: 'USER_RECORDED' as StatusSourceType,
    });

    // Refresh application list & active detail
    if (selectedProfileId) {
      const updatedList = await listApplications(selectedProfileId);
      setApplications(updatedList);
    }
    if (selectedAppId) {
      const updatedDetail = await getApplicationDetail(selectedAppId);
      setSelectedAppDetail(updatedDetail);
    }
  };

  // Filtered Applications
  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.current_status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      app.scheme_name.toLowerCase().includes(query) ||
      app.scheme_code.toLowerCase().includes(query) ||
      (app.application_reference_number &&
        app.application_reference_number.toLowerCase().includes(query)) ||
      (app.partner_name && app.partner_name.toLowerCase().includes(query));

    return matchesStatus && matchesQuery;
  });

  // Metrics
  const totalCount = applications.length;
  const startedCount = applications.filter((a) => a.current_status === 'APPLICATION_STARTED').length;
  const inReviewCount = applications.filter(
    (a) => a.current_status === 'SUBMITTED' || a.current_status === 'UNDER_REVIEW'
  ).length;
  const approvedCount = applications.filter(
    (a) => a.current_status === 'APPROVED' || a.current_status === 'COMPLETED'
  ).length;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-200">Dashboard</Link>
            <span>/</span>
            <span className="text-emerald-400 font-medium">Application Tracker</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-emerald-400" />
            <span>Scheme Application Tracker & Timeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit-grade lifecycle tracking with verified channel partner guidance and status history.
          </p>
        </div>

        {/* Profile Switcher & New App CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          {profiles.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedProfileId || ''}
                onChange={(e) => handleProfileChange(Number(e.target.value))}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.full_name} ({p.district || 'All Districts'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href="/schemes"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Track New Scheme
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400 block font-medium">Total Applications</span>
          <span className="text-2xl font-extrabold text-slate-100 mt-1 block">{totalCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400 block font-medium">In Preparation</span>
          <span className="text-2xl font-extrabold text-blue-400 mt-1 block">{startedCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400 block font-medium">Submitted / Under Review</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{inReviewCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400 block font-medium">Approved / Sanctioned</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{approvedCount}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your recorded applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">No Applications Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Explore best-fit government schemes matched to your profile, generate your pre-application guidance package, and start tracking your journey.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/schemes"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 inline-flex items-center gap-2"
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
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
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
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/60 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading timeline...</p>
              </div>
            ) : selectedAppDetail ? (
              <div className="space-y-5">
                {/* Header Card with Quick Update */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-bold">
                          {selectedAppDetail.scheme_code}
                        </span>
                        {selectedAppDetail.application_reference_number && (
                          <span className="font-mono text-xs text-slate-400">
                            Ref: {selectedAppDetail.application_reference_number}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {selectedAppDetail.scheme_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {selectedAppDetail.nodal_ministry || 'Nodal Ministry'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setModalApp(selectedAppDetail);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shrink-0"
                    >
                      Update Status
                    </button>
                  </div>

                  {/* Stage Explanation & Next Action */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Current Status Explanation
                      </span>
                      <p className="text-slate-200 mt-0.5">
                        {selectedAppDetail.status_explanation}
                      </p>
                    </div>

                    {selectedAppDetail.next_recommended_action && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          Recommended Next Action
                        </span>
                        <p className="text-slate-300 mt-0.5">
                          {selectedAppDetail.next_recommended_action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Channel Partner Card */}
                {selectedAppDetail.channel_partner && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Assigned Channel Partner / Branch
                    </h4>
                    <PartnerCard partner={selectedAppDetail.channel_partner} />
                  </div>
                )}

                {/* Timeline History */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <ApplicationTimeline
                    history={selectedAppDetail.status_history || []}
                    currentStatus={selectedAppDetail.current_status}
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400">
                Select an application from the list to view its complete timeline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-guarantee Disclaimer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>Statutory Provenance Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed">
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
