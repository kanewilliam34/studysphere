"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Note, StudyGroup, User } from "@/lib/api";
import {
  FileText,
  UploadCloud,
  Share2,
  Download,
  Lock,
  Plus,
  ShieldCheck,
  X,
  FileCheck,
  Users,
} from "lucide-react";

export default function NotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Share modal state
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [shareTargetType, setShareTargetType] = useState<"user" | "group">("group");
  const [targetId, setTargetId] = useState("");
  const [sharing, setSharing] = useState(false);

  const fetchNotesAndContext = async () => {
    try {
      setLoading(true);
      const [notesData, groupsData, usersData] = await Promise.all([
        api.getNotes(),
        api.getGroups(),
        api.getUsers(),
      ]);
      setNotes(notesData);
      setGroups(groupsData);
      setAllUsers(usersData.filter((u) => u.id !== user?.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchNotesAndContext();
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only valid PDF files (.pdf) are allowed.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    if (description) formData.append("description", description.trim());

    try {
      await api.uploadNote(formData);
      setShowUploadModal(false);
      setFile(null);
      setTitle("");
      setDescription("");
      fetchNotesAndContext();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (note: Note) => {
    try {
      const blob = await api.downloadNoteUrl(note.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download note");
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !targetId) return;

    setSharing(true);
    try {
      await api.shareNote(selectedNote.id, {
        user_id: shareTargetType === "user" ? targetId : undefined,
        group_id: shareTargetType === "group" ? targetId : undefined,
      });
      alert("Note successfully shared!");
      setSelectedNote(null);
      fetchNotesAndContext();
    } catch (err: any) {
      alert(err.message || "Failed to share note");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            Study Notes & Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Private, authenticated PDF storage with magic-byte signature validation and resource-level authorization.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" /> Upload PDF Note
        </button>
      </div>

      {/* Security info card */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <strong>OWASP Private Storage Architecture:</strong> Notes are stored outside the public document root with randomized UUID keys. Unauthenticated access is blocked, and downloads are checked against per-user or group permissions.
        </p>
      </div>

      {/* Notes Listing */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading authorized notes...</div>
      ) : notes.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No notes available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t uploaded any notes yet, and no peer has shared a note with you.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Upload Your First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => {
            const isOwner = note.owner_id === user?.id;
            return (
              <div
                key={note.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> PDF
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(note.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2.5">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {note.description || "No description provided."}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Uploaded by: <strong className="text-slate-700 dark:text-slate-300">{isOwner ? "You" : note.owner_name}</strong></span>
                    {note.permissions && note.permissions.length > 0 && (
                      <span className="text-indigo-600 font-medium text-[11px]">
                        Shared ({note.permissions.length})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(note)}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => setSelectedNote(note)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                        title="Share with user or group"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                Upload PDF Document
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Lecture 4: Virtual Memory"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of contents, chapters, or syllabus covered..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PDF File (Max 10MB) *
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300 cursor-pointer"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Inspected for %PDF magic bytes before saving.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file || !title.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow transition"
                >
                  {uploading ? "Uploading..." : "Save Privately"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Note Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Share &quot;{selectedNote.title}&quot;
              </h2>
              <button
                onClick={() => setSelectedNote(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Share With
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => { setShareTargetType("group"); setTargetId(""); }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      shareTargetType === "group"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Study Group
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShareTargetType("user"); setTargetId(""); }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      shareTargetType === "user"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Specific Peer
                  </button>
                </div>

                {shareTargetType === "group" ? (
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a Study Group...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.member_count} members)
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a Student...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing || !targetId}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow transition"
                >
                  {sharing ? "Sharing..." : "Grant Permission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
