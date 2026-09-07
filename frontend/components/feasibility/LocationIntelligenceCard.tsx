'use client';

import React from 'react';
import {
  MapPin,
  Building2,
  Navigation,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { DistrictEcosystem, NearbyCluster } from '@/types';

interface LocationIntelligenceCardProps {
  districtEcosystem?: DistrictEcosystem | null;
  nearbyClusters?: NearbyCluster[];
}

export const LocationIntelligenceCard: React.FC<LocationIntelligenceCardProps> = ({
  districtEcosystem,
  nearbyClusters = [],
}) => {
  if (!districtEcosystem && nearbyClusters.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
        <MapPin className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Location Intelligence Available</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Specify your enterprise district and state in onboarding to view verified MSME industrial clusters,
          DIC office contacts, and spatial ecosystem data.
        </p>
      </div>
    );
  }

  const districtName = districtEcosystem?.district_name || districtEcosystem?.district || 'District';
  const stateName = districtEcosystem?.state_name || districtEcosystem?.state || 'State';
  const thrustSectors = districtEcosystem?.thrust_sectors || districtEcosystem?.prominent_sectors || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <MapPin className="w-5 h-5 text-emerald-400" />
        <h3 className="text-base font-semibold text-slate-100">
          Geographic MSME Ecosystem & Spatial Intelligence
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: District Profile */}
        {districtEcosystem && (
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-100">
                    {districtName}, {stateName}
                  </h4>
                  {districtEcosystem.tier && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Tier {districtEcosystem.tier}
                    </span>
                  )}
                </div>
                {districtEcosystem.category && (
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">
                    Category: {districtEcosystem.category}
                  </p>
                )}
              </div>

              {districtEcosystem.industrial_density_score !== undefined && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-right">
                  <div className="text-[11px] text-emerald-400 uppercase font-medium">
                    Industrial Density
                  </div>
                  <div className="text-base font-bold text-emerald-300">
                    {districtEcosystem.industrial_density_score} / 100
                  </div>
                </div>
              )}
            </div>

            {/* Thrust & Priority Sectors */}
            {thrustSectors.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Priority MSME Thrust Sectors:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {thrustSectors.map((sec: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Infrastructure Highlights */}
            {districtEcosystem.infrastructure_highlights && (
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
                <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Industrial Infrastructure & Connectivity:
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {districtEcosystem.infrastructure_highlights}
                </p>
              </div>
            )}

            {/* District Industries Centre (DIC) Details */}
            {(districtEcosystem.dic_office_address || districtEcosystem.dic_contact_phone) && (
              <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-500/20 space-y-2">
                <div className="text-xs font-semibold text-blue-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    District Industries Centre (DIC) Office
                  </span>
                  <span className="text-[11px] text-blue-400/80">Nodal Support Office</span>
                </div>

                {districtEcosystem.dic_office_address && (
                  <p className="text-xs text-slate-300">{districtEcosystem.dic_office_address}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  {districtEcosystem.dic_contact_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-blue-400" />
                      <span>{districtEcosystem.dic_contact_phone}</span>
                    </div>
                  )}
                  {districtEcosystem.dic_contact_email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-blue-400" />
                      <span>{districtEcosystem.dic_contact_email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right 1 Col: Nearby Clusters */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-slate-100">
                  Nearby MSME Clusters ({nearbyClusters.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">PostGIS Spatial Proximity</span>
            </div>

            {nearbyClusters.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  No registered MSME clusters within default proximity radius for this district.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyClusters.map((cluster, idx) => (
                  <div
                    key={cluster.id || cluster.cluster_code || idx}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-semibold text-slate-100">{cluster.cluster_name}</h5>
                      {cluster.distance_km !== null && cluster.distance_km !== undefined && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                          {cluster.distance_km.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cluster.sector} • {cluster.cluster_type || 'Industrial'}
                    </p>
                    {cluster.specialization && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {cluster.specialization}
                      </p>
                    )}
                    {(cluster.source_agency || cluster.source_name) && (
                      <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
                        <span>{cluster.source_agency || cluster.source_name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>MSME-CDP Database</span>
            <span className="text-emerald-400/80">Spatial SRID: 4326</span>
          </div>
        </div>
      </div>
    </div>
  );
};
