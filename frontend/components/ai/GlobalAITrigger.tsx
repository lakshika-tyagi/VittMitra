'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GroundedChatDrawer } from './GroundedChatDrawer';
import { useProfile } from '@/hooks/useProfile';

export const GlobalAITrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeProfileId } = useProfile();

  return (
    <>
      {/* Floating Action Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 900,
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.65rem 1.15rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            color: '#ffffff',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5), 0 8px 10px -6px rgba(79, 70, 229, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Open VittMitra AI Assistant"
        >
          <div
            style={{
              padding: '0.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} color="#fde047" className="pulse-dot" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.025em' }}>
            Ask VittMitra AI
          </span>
          <span
            style={{
              padding: '0.125rem 0.4rem',
              fontSize: '0.6rem',
              fontWeight: 800,
              backgroundColor: '#34d399',
              color: '#022c22',
              borderRadius: '9999px',
            }}
          >
            LIVE
          </span>
        </button>
      </div>

      {/* Slide-Out AI Assistant Sidebar Drawer */}
      <GroundedChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeProfileId={activeProfileId ? String(activeProfileId) : null}
      />
    </>
  );
};

