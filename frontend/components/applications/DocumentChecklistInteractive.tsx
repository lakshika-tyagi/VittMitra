'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { RequiredDocumentChecklist } from '@/types';

interface DocumentChecklistInteractiveProps {
  documents: RequiredDocumentChecklist[];
  initialChecked?: Record<string, boolean>;
  onChange?: (checkedMap: Record<string, boolean>) => void;
}

export const DocumentChecklistInteractive: React.FC<DocumentChecklistInteractiveProps> = ({
  documents,
  initialChecked = {},
  onChange,
}) => {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(initialChecked);

  const toggleCheck = (code: string) => {
    const updated = {
      ...checkedMap,
      [code]: !checkedMap[code],
    };
    setCheckedMap(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  const totalCount = documents.length;
  const readyCount = documents.filter((d) => checkedMap[d.document_code]).length;
  const mandatoryCount = documents.filter((d) => d.is_mandatory).length;
  const mandatoryReadyCount = documents.filter((d) => d.is_mandatory && checkedMap[d.document_code]).length;
  const completionPct = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-semibold text-slate-100">
              Required Documents Checklist
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Check off documents as you assemble them before submitting to the portal or channel partner.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">
              {readyCount} of {totalCount} ready
            </div>
            <div className="text-[11px] text-slate-400">
              ({mandatoryReadyCount}/{mandatoryCount} mandatory)
            </div>
          </div>
          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completionPct === 100 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      {documents.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">
          No specific documents registered for this scheme. Standard KYC and business registration apply.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {documents.map((doc) => {
            const isChecked = !!checkedMap[doc.document_code];
            return (
              <div
                key={doc.document_code}
                onClick={() => toggleCheck(doc.document_code)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isChecked
                    ? 'border-emerald-500/40 bg-emerald-950/15 text-slate-200'
                    : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 shrink-0 hover:text-emerald-400"
                  aria-label={isChecked ? 'Mark unready' : 'Mark ready'}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold ${
                        isChecked ? 'text-emerald-300 line-through opacity-80' : 'text-slate-200'
                      }`}
                    >
                      {doc.document_name}
                    </span>
                    {doc.is_mandatory ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/50">
                        Mandatory
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Optional / Supporting
                      </span>
                    )}
                  </div>

                  {doc.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {doc.issuing_authority && (
                    <div className="text-[11px] text-slate-500">
                      Issuing Authority: <span className="text-slate-400">{doc.issuing_authority}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
