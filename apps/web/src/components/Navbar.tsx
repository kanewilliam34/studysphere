"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  MessageSquare,
  Bot,
  FileText,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Radio,
  BookOpen,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, nexconnStatus, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/groups", label: "Study Groups", icon: Users },
    { href: "/chat", label: "Direct Chat", icon: MessageSquare },
    { href: "/ai", label: "AI Tutor", icon: Bot },
    { href: "/notes", label: "Notes", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">StudySphere</span>
            <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase -mt-1">
              Collaborative Learning
            </span>
          </div>
        </Link>

        {/* Navigation Items (when logged in) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Nexconn Status Indicator */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                title="Nexconn Real-Time Messaging Connection Status"
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    nexconnStatus === "CONNECTED"
                      ? "text-emerald-500 animate-pulse"
                      : nexconnStatus === "CONNECTING"
                      ? "text-amber-500"
                      : "text-slate-400"
                  }`}
                />
                <span className="text-slate-600 dark:text-slate-400">
                  Nexconn:{" "}
                  <strong
                    className={
                      nexconnStatus === "CONNECTED"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : nexconnStatus === "CONNECTING"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-500"
                    }
                  >
                    {nexconnStatus}
                  </strong>
                </span>
              </div>

              {/* User badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-semibold text-xs border border-indigo-200 dark:border-indigo-800">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user.name}
                </span>
                <button
                  onClick={() => logout()}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
