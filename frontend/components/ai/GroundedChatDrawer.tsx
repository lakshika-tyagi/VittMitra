'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GroundedChatRequest, GroundedChatResponse, ConfidenceLevel } from '@/types';
import { sendChatMessage } from '@/services/api';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceCitationCard } from './SourceCitationCard';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  confidence?: ConfidenceLevel;
  sources?: any[];
  limitations?: string[];
  suggestedActions?: string[];
  timestamp: string;
}

interface GroundedChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfileId?: string | null;
  activeSchemeCode?: string | null;
  initialQuery?: string | null;
}

export const GroundedChatDrawer: React.FC<GroundedChatDrawerProps> = ({
  isOpen,
  onClose,
  activeProfileId = null,
  activeSchemeCode = null,
  initialQuery = null,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSourcesMessageId, setExpandedSourcesMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    activeSchemeCode
      ? `Why am I eligible for ${activeSchemeCode}?`
      : 'Which scheme offers the highest subsidy for manufacturing?',
    activeSchemeCode
      ? `What documents do I need for ${activeSchemeCode}?`
      : 'What documents are required to apply for PMEGP?',
    activeSchemeCode
      ? `Explain the EMI and subsidy structure for ${activeSchemeCode}`
      : 'How is my financing requirement calculated?',
    'What should I do before visiting the bank or DIC?',
  ];

  // Initialize with welcome message or initial query
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'ai',
        text: activeSchemeCode
          ? `Hello! I am VittMitra AI. I can explain eligibility requirements, financial structures, document checklists, and application procedures for ${activeSchemeCode} grounded strictly in official government guidelines. What would you like to know?`
          : 'Hello! I am VittMitra AI, your decision-support assistant. Ask me questions about central & state MSME credit schemes, eligibility criteria, subsidy structures, or document requirements.',
        confidence: 'HIGH',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);

      if (initialQuery) {
        handleSendMessage(initialQuery);
      }
    }
  }, [isOpen, activeSchemeCode, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    setError(null);
    setInputQuery('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const payload: GroundedChatRequest = {
        message: textToSend,
        profile_id: activeProfileId || undefined,
        scheme_id: activeSchemeCode || undefined,
      };

      const response: GroundedChatResponse = await sendChatMessage(payload);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        confidence: response.confidence || 'HIGH',
        sources: response.sources,
        limitations: response.limitations,
        suggestedActions: response.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      setError(err.message || 'Unable to retrieve answer. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSourcesMessageId((prev) => (prev === msgId ? null : msgId));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="copilot-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />

      {/* Slide-out Sidebar Drawer Panel */}
      <div
        className="copilot-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '480px',
          height: '100vh',
          maxHeight: '100vh',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.12)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>VittMitra AI Copilot</span>
                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                  GROUNDED
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {activeSchemeCode ? `Grounded in ${activeSchemeCode} Guidelines` : 'Verified Scheme Decision Support'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Context Bar */}
        {(activeSchemeCode || activeProfileId) && (
          <div
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#2563eb',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <BookOpen size={14} />
              Context: {activeSchemeCode ? `Scheme ${activeSchemeCode}` : 'Entrepreneur Profile'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Deterministic Rule Grounding
            </span>
          </div>
        )}

        {/* Chat Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: '#f8fafc',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '90%',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  backgroundColor: msg.sender === 'user' ? '#2563eb' : '#ffffff',
                  border: msg.sender === 'user' ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
                  color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                  borderTopRightRadius: msg.sender === 'user' ? '2px' : '14px',
                  borderTopLeftRadius: msg.sender === 'ai' ? '2px' : '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {/* AI Message Header */}
                {msg.sender === 'ai' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      paddingBottom: '0.4rem',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                      <Bot size={14} />
                      <span>VittMitra AI</span>
                    </div>
                    {msg.confidence && <ConfidenceBadge confidence={msg.confidence} />}
                  </div>
                )}

                {/* Message Text */}
                <div style={{ fontSize: '0.82rem', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>

                {/* Suggested Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      color: '#065f46',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: '#059669' }}>
                      Suggested Next Steps:
                    </div>
                    <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                      {msg.suggestedActions.map((act, i) => (
                        <li key={i} style={{ marginBottom: '0.2rem' }}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Limitations */}
                {msg.limitations && msg.limitations.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.6rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      fontSize: '0.73rem',
                      color: '#92400e',
                    }}
                  >
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem', color: '#d97706' }}>
                      <AlertCircle size={12} />
                      <span>Context Note:</span>
                    </div>
                    <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                      {msg.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources Section */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => toggleSources(msg.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        fontSize: '0.72rem',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '0.2rem 0',
                        background: 'transparent',
                        border: 'none',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontWeight: 600 }}>
                        <BookOpen size={12} />
                        {msg.sources.length} Official Grounding Source{msg.sources.length > 1 ? 's' : ''}
                      </span>
                      {expandedSourcesMessageId === msg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {expandedSourcesMessageId === msg.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {msg.sources.map((src, i) => (
                          <SourceCitationCard key={i} source={src} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div style={{ textAlign: 'right', marginTop: '0.4rem', fontSize: '0.65rem', color: '#94a3b8' }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '10px', color: '#2563eb', fontSize: '0.8rem' }}>
              <Loader2 size={16} className="pulse-dot" />
              <span>Synthesizing grounded answer from official scheme criteria...</span>
            </div>
          )}

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: '0.6rem 1.25rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '0.35rem' }}>
            QUICK QUESTIONS:
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '0.72rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about subsidies, eligibility, documents..."
              disabled={loading}
              className="form-input"
              style={{ fontSize: '0.82rem' }}
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="btn-primary"
              style={{ padding: '0.65rem 1rem', flexShrink: 0 }}
            >
              {loading ? <Loader2 size={16} className="pulse-dot" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
