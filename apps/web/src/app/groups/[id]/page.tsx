"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, StudyGroup } from "@/lib/api";
import { nexconnManager, ChatMessage } from "@/lib/nexconn";
import {
  Users,
  Send,
  Radio,
  Lock,
  Globe,
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  MessageSquare,
} from "lucide-react";

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, nexconnStatus } = useAuth();
  const groupId = params.id as string;

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const data = await api.getGroup(groupId);
      setGroup(data);

      if (data.nexconn_channel_id) {
        // Load existing history
        const hist = nexconnManager.getHistory(data.nexconn_channel_id);
        setMessages([...hist]);
      }
    } catch (err: any) {
      alert(err.message || "Failed to load study group");
      router.push("/groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchGroup();
  }, [groupId, user]);

  useEffect(() => {
    if (!group?.nexconn_channel_id) return;

    const channelId = group.nexconn_channel_id;

    // Register live message listener
    const unsubscribe = nexconnManager.onMessage(`group_${groupId}`, (msg) => {
      if (msg.targetId === channelId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [group?.nexconn_channel_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !group?.nexconn_channel_id) return;

    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const sent = await nexconnManager.sendGroupMessage(group.nexconn_channel_id, text);
      setMessages((prev) => {
        if (prev.find((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err) {
      console.error("Failed to send message via Nexconn:", err);
    } finally {
      setSending(false);
    }
  };

  const handleJoin = async () => {
    try {
      await api.joinGroup(groupId);
      fetchGroup();
    } catch (err: any) {
      alert(err.message || "Failed to join group");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this study group?")) return;
    try {
      await api.leaveGroup(groupId);
      fetchGroup();
    } catch (err: any) {
      alert(err.message || "Failed to leave group");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Study Groups
        </Link>

        <div className="flex items-center gap-2">
          {group.is_member ? (
            <button
              onClick={handleLeave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-300 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-semibold transition"
            >
              <UserX className="w-3.5 h-3.5" /> Leave Group
            </button>
          ) : (
            <button
              onClick={handleJoin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition"
            >
              <UserCheck className="w-3.5 h-3.5" /> Join Group
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Chat & Members Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Chat Interface (3 cols) */}
        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[550px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {group.name}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                  {group.subject || "Study Group"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Channel ID: <span className="font-mono text-[10px]">{group.nexconn_channel_id}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                Nexconn Group Channel
              </span>
            </div>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">No messages in this study group yet.</p>
                <p className="text-xs">Say hello and start collaborating with your study group members!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {isMe ? "You" : m.senderName}
                      </span>
                      <span>•</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {group.is_member ? (
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message to your study group..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              You must be a member of this group to send messages.{" "}
              <button onClick={handleJoin} className="text-indigo-600 font-semibold hover:underline">
                Join now
              </button>
            </div>
          )}
        </div>

        {/* Group Details & Members Sidebar (1 col) */}
        <div className="space-y-5">
          {/* Overview Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              About This Group
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {group.description || "No description provided."}
            </p>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Visibility</span>
                <span className="font-semibold capitalize flex items-center gap-1">
                  {group.visibility === "private" ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  {group.visibility}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Your Role</span>
                <span className="font-semibold capitalize text-indigo-600 dark:text-indigo-400">
                  {group.user_role || "Non-member"}
                </span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Members ({group.members?.length || group.member_count})
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {group.members?.map((gm) => (
                <div key={gm.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {gm.user?.name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {gm.user?.name} {gm.user_id === user?.id && "(You)"}
                      </p>
                      <p className="text-[10px] text-slate-400">{gm.user?.email}</p>
                    </div>
                  </div>
                  {gm.role === "owner" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Owner
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
