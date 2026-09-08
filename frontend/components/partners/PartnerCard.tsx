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
        return { label: 'District Industries Centre (DIC)', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'PUBLIC_SECTOR_BANK':
        return { label: 'Public Sector Bank', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'IMPLEMENTING_AGENCY':
        return { label: 'Implementing Agency', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'NODAL_AGENCY':
        return { label: 'Nodal Ministry Agency', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'RRB':
        return { label: 'Regional Rural Bank', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'FACILITATION_CENTRE':
        return { label: 'Facilitation Centre', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      default:
        return { label: type.replace(/_/g, ' '), bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getPartnerTypeBadge(partner.partner_type);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 p-5 space-y-4 bg-white ${
        isSelected
          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Top row: Name & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {partner.verification_status}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{partner.organization_name}</span>
          </h4>
        </div>

        {onSelectForApplication && (
          <button
            type="button"
            onClick={() => onSelectForApplication(partner)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
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

      {/* Contact & Address Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
        {(partner as any).branch_name && (
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-bold block">Branch</span>
            <span className="font-semibold text-slate-800">{(partner as any).branch_name}</span>
          </div>
        )}

        {partner.address && (
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-bold block">Address</span>
            <span className="text-slate-600 font-medium">{partner.address}</span>
          </div>
        )}

        {partner.contact_phone && (
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-bold block">Phone</span>
            <a
              href={`tel:${partner.contact_phone}`}
              className="font-mono text-blue-600 hover:underline font-semibold"
            >
              {partner.contact_phone}
            </a>
          </div>
        )}

        {partner.contact_email && (
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-bold block">Email</span>
            <a
              href={`mailto:${partner.contact_email}`}
              className="font-mono text-blue-600 hover:underline font-semibold"
            >
              {partner.contact_email}
            </a>
          </div>
        )}
      </div>

      {/* Official URL */}
      {(partner as any).website_url && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Official Portal Link</span>
          <a
            href={(partner as any).website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
          >
            Visit Website <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};

export default PartnerCard;
