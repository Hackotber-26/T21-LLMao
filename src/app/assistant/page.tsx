'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Problem } from '@/types/api.types';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  Users,
  RotateCcw,
  ChevronRight,
  Compass,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendedProblems?: Problem[];
}

const STARTER_PROMPTS = [
  'I am a full-stack engineer looking to build open-source tools for urban transit and mobility.',
  'What are the most urgent healthcare and hospital waiting room problems reported by users?',
  'I have experience with IoT and civic tech. What neighborhood infrastructure challenges need solving?',
  'I know Next.js, Python, and GIS. Recommend high-impact real-world problems for a hackathon.',
];

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
          <p className="text-sm text-slate-400">Loading Solvyn AI Assistant...</p>
        </div>
      }
    >
      <AssistantChatContent />
    </Suspense>
  );
}

function AssistantChatContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load real problems for grounding and card rendering
  useEffect(() => {
    async function fetchProblems() {
      try {
        const res = await api.getProblems({ limit: 50 });
        setAllProblems(res.items);
      } catch (err) {
        console.error('Failed to load problems context:', err);
      }
    }
    fetchProblems();

    // Initial greeting
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'assistant',
        content:
          "Hello! I am the Solvyn Problem Discovery Assistant. Tell me about your technical background, skills, or problem domains you care about (e.g. transportation, healthcare, civic infrastructure), and I'll match you with active real-world problem statements reported by everyday people.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Match real problem statements based on query and assistant reply
  const findMatchingProblems = (query: string, replyText: string): Problem[] => {
    if (!allProblems || allProblems.length === 0) return [];

    const combined = `${query} ${replyText}`.toLowerCase();
    const matches: Problem[] = [];

    // Check specific problem IDs or keywords
    allProblems.forEach((problem) => {
      let score = 0;
      if (combined.includes(problem.id)) score += 10;
      if (problem.category && combined.includes(problem.category.toLowerCase())) score += 5;
      if (problem.title.toLowerCase().split(' ').some((word) => word.length > 3 && combined.includes(word))) {
        score += 3;
      }
      if (problem.keywords?.some((k) => combined.includes(k.toLowerCase()))) {
        score += 4;
      }

      if (score > 3) {
        matches.push(problem);
      }
    });

    // Return top 2 matching problems, or fallback to top problem if transit/health mentioned
    if (matches.length > 0) {
      return matches.slice(0, 2);
    }

    if (combined.includes('transit') || combined.includes('bus') || combined.includes('bmtc')) {
      const transit = allProblems.find((p) => p.category?.toLowerCase().includes('transport'));
      if (transit) return [transit];
    }

    if (combined.includes('health') || combined.includes('hospital') || combined.includes('opd')) {
      const health = allProblems.find((p) => p.category?.toLowerCase().includes('health'));
      if (health) return [health];
    }

    return [];
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text);
      const matchingProblems = findMatchingProblems(text, response.reply);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProblems: matchingProblems.length > 0 ? matchingProblems : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content:
          'I encountered friction reaching the backend assistant API. You can still browse all real problem clusters directly from the Discovery feed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'assistant',
        content:
          "Conversation cleared. Describe your interests, skills, or target impact areas, and I'll find relevant real-world problem statements.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              Solvyn Problem Matcher
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                AI Grounded
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Conversational matchmaking between your engineering skills and verified community friction
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-white bg-[#0C1018] border border-white/[0.08] transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } animate-in fade-in duration-150`}
          >
            <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[80%]">
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded bg-[#0C1018] border border-white/[0.08] flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div>
                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-lg text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-rose-600 text-white font-medium'
                      : 'card-structured text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {/* Timestamp */}
                <span className="block text-[10px] text-slate-500 font-mono mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Recommended Problem Cards */}
                {msg.recommendedProblems && msg.recommendedProblems.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 uppercase tracking-wider">
                      <Compass className="w-3 h-3" />
                      Recommended Problem Clusters
                    </span>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.recommendedProblems.map((prob) => (
                        <Link
                          key={prob.id}
                          href={`/problems/${prob.id}`}
                          className="group block p-3.5 rounded-lg card-structured hover:border-rose-500/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                              {prob.category || 'General'}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Users className="w-3 h-3 text-rose-400" />
                              <span>{prob.report_count} reports</span>
                            </div>
                          </div>

                          <h4 className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors line-clamp-1 mb-1">
                            {prob.title}
                          </h4>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                            {prob.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-rose-400 font-medium">
                            <span>Inspect Sub-Problems &amp; Solutions</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded bg-[#0C1018] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5 animate-in fade-in">
            <div className="w-7 h-7 rounded bg-[#0C1018] border border-white/[0.08] flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-lg card-structured text-xs text-slate-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              <span>Matching problem statements from Solvyn database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts (if chat is fresh or only greeting exists) */}
      {messages.length <= 1 && (
        <div className="pb-2.5 pt-1 shrink-0">
          <span className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Suggested starter queries:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-left p-2 rounded-lg card-structured hover:border-rose-500/40 text-xs text-slate-300 hover:text-white transition-colors line-clamp-2"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative pt-1.5 shrink-0"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Describe your skills or target domain (e.g. 'I know Python & ML, what transit problems exist?')..."
            className="w-full pl-3.5 pr-20 py-2.5 rounded-lg border border-white/[0.12] bg-[#0C1018] text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-rose-500/80 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
