"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, User } from "@/lib/api";
import { nexconnManager, ChatMessage } from "@/lib/nexconn";
import {
  MessageSquare,
  Send,
  Users,
  Search,
  Radio,
  Lock,
} from "lucide-react";

export default function DirectChatPage() {
  const router = useRouter();
  const { user, nexconnStatus } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    api
      .getUsers()
      .then((allUsers) => {
        const others = allUsers.filter((u) => u.id !== user.id);
        setUsers(others);
        if (others.length > 0) {
          setActiveRecipient(others[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  // Load message history when active recipient changes
  useEffect(() => {
    if (!activeRecipient) return;
    const history = nexconnManager.getHistory(activeRecipient.id);
    setMessages([...history]);

    const unsubscribe = nexconnManager.onMessage(`direct_${activeRecipient.id}`, (msg) => {
      if (
        (msg.channelType === "direct" && msg.senderId === activeRecipient.id) ||
        (msg.channelType === "direct" && msg.targetId === activeRecipient.id)
      ) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeRecipient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRecipient) return;

    const text = newMessage.trim();
    setNewMessage("");

    try {
      const sent = await nexconnManager.sendDirectMessage(activeRecipient.id, text);
      setMessages((prev) => {
        if (prev.find((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err) {
      console.error("Failed to send direct message:", err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
          Direct Private Messaging
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          1-to-1 real-time messaging powered by Nexconn Direct Channels.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[580px]">
        {/* Contacts Sidebar (1 col) */}
        <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find peer student..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading peers...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No other registered students yet.</div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = activeRecipient?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setActiveRecipient(u)}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/60"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Panel (3 cols) */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col min-h-[500px]">
          {activeRecipient ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {activeRecipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeRecipient.name}
                    </h2>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> End-to-end authorized direct message
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  Nexconn Direct Channel
                </span>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-medium">No messages with {activeRecipient.name} yet.</p>
                    <p className="text-xs">Send a direct message to begin your private conversation.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
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

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Send private message to ${activeRecipient.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold">Select a peer to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
