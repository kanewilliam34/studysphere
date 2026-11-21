"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, StudyGroup, Note, AIConversation } from "@/lib/api";
import {
  Users,
  MessageSquare,
  Bot,
  FileText,
  ShieldCheck,
  ArrowRight,
  Radio,
  Sparkles,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const { user, nexconnStatus, isLoading } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      Promise.all([api.getGroups(), api.getNotes(), api.getConversations()])
        .then(([g, n, c]) => {
          setGroups(g);
          setNotes(n);
          setConversations(c);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingData(false));
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Logged-in Dashboard
  if (user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              StudySphere 1.0 Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.name}!
            </h1>
            <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
              Connect with your peer study groups, explore interactive explanations with your AI Tutor, and collaborate on verified PDF notes.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 relative z-10">
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 font-semibold text-sm hover:bg-indigo-50 shadow transition-colors"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Explore Study Groups
            </Link>
            <Link
              href="/ai"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 border border-indigo-400/30 text-white font-medium text-sm transition-colors"
            >
              <Bot className="w-4 h-4" />
              Ask AI Tutor
            </Link>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Nexconn Messaging</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
                  {nexconnStatus.toLowerCase()}
                </p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Security Baseline</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Argon2id + OWASP</p>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">AI Inference</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Ollama Local Engine</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Study Groups */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Your Study Groups
              </h2>
              <Link href="/groups" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingData ? (
              <div className="p-8 text-center text-slate-400">Loading your groups...</div>
            ) : groups.length === 0 ? (
              <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">No study groups joined yet.</p>
                <Link
                  href="/groups"
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create or Join a Group
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.slice(0, 4).map((g) => (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-sm group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {g.subject || "General"}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">{g.visibility}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 group-hover:text-indigo-600 transition-colors">
                      {g.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {g.description || "No description provided."}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>{g.member_count} members</span>
                      <span className="text-indigo-600 font-medium flex items-center gap-1">
                        Open Chat <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Recent Notes */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Study Notes & Documents
                </h2>
                <Link href="/notes" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                  Manage Notes <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {notes.length === 0 ? (
                <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500">No notes uploaded yet. Upload a PDF to share with authorized peers.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  {notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{note.title}</p>
                          <p className="text-[11px] text-slate-400">
                            By {note.owner_name || "You"} • {(note.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/notes"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Tutor Sidebar Widget */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              AI Tutor Sessions
            </h2>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <p className="text-xs text-slate-500">
                Ask questions to your local Ollama tutor model. Explanations, math proofs, code snippets, and study revision.
              </p>
              <Link
                href="/ai"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow transition"
              >
                <Bot className="w-4 h-4" /> Start New AI Session
              </Link>

              {conversations.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Past Questions</p>
                  <div className="space-y-1.5">
                    {conversations.slice(0, 5).map((conv) => (
                      <Link
                        key={conv.id}
                        href="/ai"
                        className="block p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition truncate"
                      >
                        {conv.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Public Landing Page
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          AI-Powered Collaborative Learning Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
          Where Students Connect, Chat, and Learn with <span className="text-indigo-600">Local AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          StudySphere brings study communities, Nexconn real-time chat, private PDF resource sharing, and local AI tutoring into one unified, secure platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-base border border-slate-200 dark:border-slate-800 transition"
          >
            Sign In to StudySphere
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nexconn Chat SDK</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Real-time group channels and direct 1:1 messaging powered by Nexconn Chat infrastructure with server-side token security.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Local AI Tutor</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Zero-budget, private AI inference powered by Ollama. Explains concepts, reviews code, and answers questions with prompt insulation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">OWASP Security Baseline</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Argon2id password hashing, private file storage with PDF magic byte verification, Anti-IDOR/BOLA authorization checks, and audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
