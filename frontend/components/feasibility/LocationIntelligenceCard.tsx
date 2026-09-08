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
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
        <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No Location Intelligence Available</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
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
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <MapPin className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-slate-900">
          Geographic MSME Ecosystem & Spatial Intelligence
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: District Profile */}
        {districtEcosystem && (
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900">
                    {districtName}, {stateName}
                  </h4>
                  {districtEcosystem.tier && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Tier {districtEcosystem.tier}
                    </span>
                  )}
                </div>
                {districtEcosystem.category && (
                  <p className="text-xs text-emerald-700 font-bold mt-0.5">
                    Category: {districtEcosystem.category}
                  </p>
                )}
              </div>

              {districtEcosystem.industrial_density_score !== undefined && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-right">
                  <div className="text-[11px] text-emerald-700 uppercase font-bold">
                    Industrial Density
                  </div>
                  <div className="text-base font-extrabold text-emerald-800">
                    {districtEcosystem.industrial_density_score} / 100
                  </div>
                </div>
              )}
            </div>

            {/* Thrust & Priority Sectors */}
            {thrustSectors.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Priority MSME Thrust Sectors:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {thrustSectors.map((sec: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize"
                    >
                      {sec.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Infrastructure Highlights */}
            {districtEcosystem.infrastructure_highlights && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Industrial Infrastructure & Connectivity:
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {districtEcosystem.infrastructure_highlights}
                </p>
              </div>
            )}

            {/* District Industries Centre (DIC) Details */}
            {(districtEcosystem.dic_office_address || districtEcosystem.dic_contact_phone) && (
              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    District Industries Centre (DIC) Office
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold">Nodal Support Office</span>
                </div>

                {districtEcosystem.dic_office_address && (
                  <p className="text-xs text-slate-700 font-medium">{districtEcosystem.dic_office_address}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-medium pt-1">
                  {districtEcosystem.dic_contact_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>{districtEcosystem.dic_contact_phone}</span>
                    </div>
                  )}
                  {districtEcosystem.dic_contact_email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{districtEcosystem.dic_contact_email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right 1 Col: Nearby Clusters */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Nearby MSME Clusters ({nearbyClusters.length})
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">PostGIS Spatial</span>
            </div>

            {nearbyClusters.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No active MSME industrial clusters mapped within standard radius.
              </p>
            ) : (
              <div className="space-y-2.5">
                {nearbyClusters.slice(0, 4).map((cluster: NearbyCluster, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {cluster.cluster_name}
                      </span>
                      {cluster.distance_km != null && typeof cluster.distance_km === 'number' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                          {cluster.distance_km.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="capitalize">{cluster.sector?.replace('_', ' ') || 'Multi-sector'}</span>
                      {cluster.cluster_type && (
                        <span className="text-slate-500">{cluster.cluster_type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified MSME Database
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationIntelligenceCard;
