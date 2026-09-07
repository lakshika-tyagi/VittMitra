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
  ShieldAlert,
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
          ? `Hello! I am VittMitra AI. I can explain eligibility requirements, financial structures, document checklists, and application procedures for ${activeSchemeCode} grounded in official guidelines. What would you like to know?`
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    setError(null);
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const payload: GroundedChatRequest = {
        message: textToSend,
        profile_id: activeProfileId,
        scheme_id: activeSchemeCode,
        topic: 'general',
      };

      const resp: GroundedChatResponse = await sendChatMessage(payload);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: resp.answer,
        confidence: resp.confidence,
        sources: resp.sources,
        limitations: resp.limitations,
        suggestedActions: resp.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to generate AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 bg-linear-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <span>Ask VittMitra AI</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md">
                  Grounded
                </span>
              </h3>
              <p className="text-xs text-indigo-100">
                {activeSchemeCode ? `Grounded in ${activeSchemeCode} Official Guidelines` : 'Verified Scheme Decision Support'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Context Bar */}
        {(activeSchemeCode || activeProfileId) && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900 shrink-0">
            <span className="font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Active Context: {activeSchemeCode ? `Scheme ${activeSchemeCode}` : 'Entrepreneur Profile'}
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold">Deterministic Grounding Active</span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {/* AI Header with Confidence */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                      <Bot className="w-3.5 h-3.5" />
                      <span>VittMitra AI</span>
                    </div>
                    {msg.confidence && <ConfidenceBadge confidence={msg.confidence} />}
                  </div>
                )}

                {/* Message Body */}
                <div className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</div>

                {/* Suggested Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 p-2.5 bg-emerald-50/80 border border-emerald-100 rounded-lg text-emerald-900 text-[11px]">
                    <div className="font-bold mb-1 flex items-center gap-1">
                      <span>Suggested Next Steps:</span>
                    </div>
                    <ul className="space-y-1">
                      {msg.suggestedActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Limitations */}
                {msg.limitations && msg.limitations.length > 0 && (
                  <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-100 rounded-lg text-amber-900 text-[11px]">
                    <div className="font-bold mb-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Context Note:</span>
                    </div>
                    <ul className="space-y-0.5">
                      {msg.limitations.map((lim, i) => (
                        <li key={i}>• {lim}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources Toggle */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSourcesMessageId(
                          expandedSourcesMessageId === msg.id ? null : msg.id
                        )
                      }
                      className="flex items-center justify-between w-full text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Verified Sources ({msg.sources.length})</span>
                      {expandedSourcesMessageId === msg.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedSourcesMessageId === msg.id && (
                      <div className="mt-2 space-y-1.5">
                        {msg.sources.map((s, idx) => (
                          <SourceCitationCard key={idx} source={s} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] text-right ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit shadow-xs animate-pulse">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-xs font-medium text-slate-600">Retrieving verified knowledge & synthesizing...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="text-red-700 font-bold hover:underline shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={activeSchemeCode ? `Ask anything about ${activeSchemeCode}...` : 'Ask a scheme, eligibility, or loan question...'}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
              title="Send Query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Statutory Note */}
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400 text-center">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            <span>AI responses are decision-support indicators grounded in verified government guidelines.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
