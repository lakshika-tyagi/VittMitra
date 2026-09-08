'use client';

import React, { useState } from 'react';
import { BusinessSignal } from '@/types';
import { SignalCard } from './SignalCard';
import { Layers, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SignalsListProps {
  signals: BusinessSignal[];
}

export const SignalsList: React.FC<SignalsListProps> = ({ signals }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showRisksOnly, setShowRisksOnly] = useState<boolean>(false);

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Signals' },
    { id: 'LOCATION_SIGNAL', label: 'Location' },
    { id: 'SECTOR_SIGNAL', label: 'Sector & Trade' },
    { id: 'BUSINESS_STAGE_SIGNAL', label: 'Stage' },
    { id: 'FINANCIAL_FEASIBILITY_SIGNAL', label: 'Financial' },
    { id: 'DATA_COMPLETENESS_SIGNAL', label: 'Completeness' },
    { id: 'RISK_SIGNAL', label: 'Risks' },
  ];

  const filteredSignals = signals.filter((signal) => {
    const isRisk = signal.is_risk !== undefined ? signal.is_risk : !signal.is_positive;
    const category = signal.category || signal.signal_type;
    if (showRisksOnly && !isRisk) return false;
    if (selectedCategory !== 'ALL' && category !== selectedCategory) return false;
    return true;
  });

  const riskCount = signals.filter((s) => (s.is_risk !== undefined ? s.is_risk : !s.is_positive)).length;
  const verifiedCount = signals.filter((s) => (s.confidence_status || s.status) === 'VERIFIED').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            Multi-Dimensional Grounded Signals ({signals.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRisksOnly(!showRisksOnly)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              showRisksOnly
                ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Risks Only ({riskCount})
          </button>

          <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {verifiedCount} Verified Data
          </span>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Signals Grid */}
      {filteredSignals.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-white shadow-xs">
          <p className="text-sm text-slate-500 font-medium">No signals match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSignals.map((signal, index) => (
            <SignalCard key={index} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SignalsList;
