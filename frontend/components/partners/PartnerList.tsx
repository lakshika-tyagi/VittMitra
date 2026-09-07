'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Filter,
  Search,
  MapPin,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { SchemePartner, ChannelPartner } from '@/types';
import { PartnerCard } from './PartnerCard';

interface PartnerListProps {
  partners: (SchemePartner | ChannelPartner)[];
  title?: string;
  subtitle?: string;
  selectedPartnerId?: number | null;
  onSelectPartner?: (partner: SchemePartner | ChannelPartner) => void;
  showFilters?: boolean;
}

export const PartnerList: React.FC<PartnerListProps> = ({
  partners,
  title = 'Verified Channel Partners & Implementing Offices',
  subtitle = 'Official district task force centres, nodal authorities, and designated lending branches',
  selectedPartnerId,
  onSelectPartner,
  showFilters = true,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const partnerTypes = useMemo(() => {
    const types = new Set<string>();
    partners.forEach((p) => {
      if (p.partner_type) types.add(p.partner_type);
    });
    return Array.from(types);
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesType = selectedType === 'ALL' || p.partner_type === selectedType;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        p.organization_name.toLowerCase().includes(query) ||
        p.district.toLowerCase().includes(query) ||
        p.state.toLowerCase().includes(query) ||
        (p.city && p.city.toLowerCase().includes(query)) ||
        p.services_offered.some((s) => s.toLowerCase().includes(query));

      return matchesType && matchesQuery;
    });
  }, [partners, selectedType, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {filteredPartners.length}
            </span>
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partner or district..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Types ({partners.length})</option>
              {partnerTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Partners List */}
      {filteredPartners.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
          <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No Matching Channel Partners</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or filter to view other implementing agencies in nearby districts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPartners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              isSelected={selectedPartnerId === partner.id}
              onSelectForApplication={onSelectPartner}
            />
          ))}
        </div>
      )}
    </div>
  );
};
