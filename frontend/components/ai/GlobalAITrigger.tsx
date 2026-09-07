'use client';

import React, { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { GroundedChatDrawer } from './GroundedChatDrawer';

export const GlobalAITrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-linear-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-white/20"
          title="Open VittMitra AI Assistant"
        >
          <div className="p-1 bg-white/20 rounded-full">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">Ask VittMitra AI</span>
          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-400 text-emerald-950 rounded-full">
            LIVE
          </span>
        </button>
      </div>

      {/* Slide-Out AI Assistant Drawer */}
      <GroundedChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
