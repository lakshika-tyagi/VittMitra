'use client';

import React from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { SchemePartner, ChannelPartner } from '@/types';
import { WhyThisPartner } from './WhyThisPartner';

interface PartnerCardProps {
  partner: SchemePartner | ChannelPartner;
  onSelectForApplication?: (partner: SchemePartner | ChannelPartner) => void;
  isSelected?: boolean;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({
  partner,
  onSelectForApplication,
  isSelected,
}) => {
  const schemePartner = partner as SchemePartner;

  const getPartnerTypeBadge = (type: string) => {
    switch (type) {
      case 'DISTRICT_INDUSTRIES_CENTRE':
        return { label: 'District Industries Centre (DIC)', bg: 'bg-amber-950/40 text-amber-300 border-amber-800/60' };
      case 'PUBLIC_SECTOR_BANK':
        return { label: 'Public Sector Bank', bg: 'bg-blue-950/40 text-blue-300 border-blue-800/60' };
      case 'IMPLEMENTING_AGENCY':
        return { label: 'Implementing Agency', bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' };
      case 'NODAL_AGENCY':
        return { label: 'Nodal Ministry Agency', bg: 'bg-purple-950/40 text-purple-300 border-purple-800/60' };
      case 'RRB':
        return { label: 'Regional Rural Bank', bg: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60' };
      case 'FACILITATION_CENTRE':
        return { label: 'Facilitation Centre', bg: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60' };
      default:
        return { label: type.replace(/_/g, ' '), bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getPartnerTypeBadge(partner.partner_type);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 p-5 space-y-4 ${
        isSelected
          ? 'border-emerald-500 bg-emerald-950/10 shadow-lg shadow-emerald-950/20'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
    >
      {/* Top row: Name & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              {partner.verification_status}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{partner.organization_name}</span>
          </h4>
        </div>

        {onSelectForApplication && (
          <button
            type="button"
            onClick={() => onSelectForApplication(partner)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              isSelected
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isSelected ? '✓ Selected Partner' : 'Select for Application'}
          </button>
        )}
      </div>

      {/* Why This Partner Section */}
      <WhyThisPartner
        whyThisPartner={schemePartner.why_this_partner}
        roleType={schemePartner.role_type}
        isPrimary={schemePartner.is_primary_partner}
        distanceKm={partner.distance_km}
        partnerType={partner.partner_type}
      />

      {/* Services Offered Tags */}
      {partner.services_offered && partner.services_offered.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Facilitation Services
          </span>
          <div className="flex flex-wrap gap-1.5">
            {partner.services_offered.map((svc, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                {svc.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Location & Contact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="leading-snug text-slate-300">{partner.address}</span>
        </div>

        <div className="space-y-1">
          {partner.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-300">{partner.contact_phone}</span>
            </div>
          )}
          {partner.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-300 truncate">{partner.contact_email}</span>
            </div>
          )}
          {partner.contact_person && (
            <div className="text-[11px] text-slate-400 pl-5.5">
              Contact: <span className="text-slate-300">{partner.contact_person}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Provenance and Link */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
        <span className="truncate">
          Source: <span className="text-slate-300">{partner.source_agency}</span>
        </span>
        {partner.official_url && (
          <a
            href={partner.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline font-medium shrink-0"
          >
            Official Website
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
