"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, AIConversation, AIMessage } from "@/lib/api";
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Clock,
} from "lucide-react";

export default function AITutorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const starterQuestions = [
    "Explain Binary Search algorithm with Python code and time complexity",
    "What is the CAP Theorem in distributed databases?",
    "How does Argon2id protect user passwords against GPU attacks?",
    "Explain B-Tree indexing vs Hash indexing in PostgreSQL",
  ];

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversation) {
        selectConversation(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const conv = await api.getConversation(id);
      setActiveConversation(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const handleAsk = async (queryText?: string) => {
    const textToAsk = queryText || question;
    if (!textToAsk.trim() || asking) return;

    const currentQ = textToAsk.trim();
    setQuestion("");
    setAsking(true);

    // Optimistic user message
    const tempUserMsg: AIMessage = {
      id: "temp_" + Date.now(),
      conversation_id: activeConversation?.id || "",
      role: "user",
      content: currentQ,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.askTutor({
        question: currentQ,
        conversation_id: activeConversation?.id,
      });

      // Update messages with AI response
      const aiMsg: AIMessage = {
        id: "ai_" + Date.now(),
        conversation_id: res.conversation_id,
        role: "assistant",
        content: res.answer,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If new conversation was created, refresh list
      if (!activeConversation || activeConversation.id !== res.conversation_id) {
        await fetchConversations();
        selectConversation(res.conversation_id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to ask AI Tutor");
    } finally {
      setAsking(false);
    }
  };

  const handleNewSession = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-purple-600" />
            StudySphere AI Tutor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Private, local inference powered by Ollama. Explanations, math proofs, code, and study assistance.
          </p>
        </div>

        <button
          onClick={handleNewSession}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Conversation
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px]">
        {/* Sessions Sidebar (1 col) */}
        <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Conversations
            </span>
            <span className="text-[10px] text-slate-400">{conversations.length} total</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading history...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No past conversations yet.</div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConversation?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`w-full p-3.5 flex items-start gap-2.5 text-left transition ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Stream & Response View (3 cols) */}
        <div className="md:col-span-3 flex flex-col min-h-[500px]">
          {/* Top Banner Notice */}
          <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
            <span className="text-xs text-purple-800 dark:text-purple-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Engine: Ollama (qwen3:0.6b) • System prompt insulation active
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" /> Zero direct DB/shell access
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center shadow-inner">
                  <Bot className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    What concept would you like to study today?
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Ask questions, verify problem solutions, or choose from one of the suggested topics below.
                  </p>
                </div>

                {/* Suggested starter chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl w-full pt-2">
                  {starterQuestions.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handleAsk(sq)}
                      className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
                        isUser
                          ? "bg-indigo-600 text-white"
                          : "bg-purple-600 text-white"
                      }`}
                    >
                      {isUser ? user?.name.charAt(0).toUpperCase() : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/60 whitespace-pre-wrap font-sans"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}

            {asking && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-purple-600"></div>
                  AI Tutor is analyzing and generating response...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Ask Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your AI Tutor a question (e.g., Explain dynamic programming with memoization)..."
              disabled={asking}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
