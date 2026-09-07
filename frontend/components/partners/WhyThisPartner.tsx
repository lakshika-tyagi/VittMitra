'use client';

import React from 'react';
import { ShieldCheck, Award, MapPin, CheckCircle2 } from 'lucide-react';

interface WhyThisPartnerProps {
  whyThisPartner?: string | null;
  roleType?: string;
  isPrimary?: boolean;
  distanceKm?: number | null;
  partnerType?: string;
}

export const WhyThisPartner: React.FC<WhyThisPartnerProps> = ({
  whyThisPartner,
  roleType,
  isPrimary,
  distanceKm,
  partnerType,
}) => {
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'NODAL_AGENCY':
        return 'Central Nodal Agency';
      case 'IMPLEMENTING_AGENCY':
        return 'Authorised Implementing Agency';
      case 'FINANCING_BANK':
        return 'Partner Lending Bank';
      case 'LOCAL_FACILITATION':
        return 'Local Facilitation Centre';
      default:
        return 'Verified Channel Partner';
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span>{getRoleLabel(roleType)}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {isPrimary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Primary Partner
            </span>
          )}
          {distanceKm !== undefined && distanceKm !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {distanceKm < 1 ? '< 1 km' : `${distanceKm.toFixed(1)} km`}
            </span>
          )}
        </div>
      </div>

      {whyThisPartner ? (
        <p className="text-xs text-slate-300 leading-relaxed">
          {whyThisPartner}
        </p>
      ) : (
        <p className="text-xs text-slate-400 leading-relaxed">
          Designated verified institution for pre-application guidance, document scrutiny, and loan appraisal.
        </p>
      )}
    </div>
  );
};
