const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  notifications: boolean;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface StudyGroup {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  subject?: string | null;
  visibility: string;
  created_at: string;
  member_count: number;
  is_member: boolean;
  user_role?: string | null;
  nexconn_channel_id?: string | null;
  members?: GroupMember[];
}

export interface NotePermission {
  id: string;
  note_id: string;
  user_id?: string | null;
  group_id?: string | null;
}

export interface Note {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  file_key: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  owner_name?: string | null;
  permissions?: NotePermission[];
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  messages?: AIMessage[];
}

export interface NexconnToken {
  app_key: string;
  user_id: string;
  access_token: string;
  base_url: string;
  is_simulated: boolean;
}

// Token storage in sessionStorage (avoids permanent localStorage exposure as per Section 10.2)
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("studysphere_token");
}

export function setAccessToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("studysphere_token", token);
  }
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("studysphere_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = "An error occurred";
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {
      detail = res.statusText;
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; password: string }) {
    const res = await request<{ access_token: string; refresh_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setAccessToken(res.access_token);
    return res;
  },

  async login(data: { email: string; password: string }) {
    const res = await request<{ access_token: string; refresh_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setAccessToken(res.access_token);
    return res;
  },

  async logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      clearAccessToken();
    }
  },

  async getMe(): Promise<User> {
    return request<User>("/users/me");
  },

  async updateProfile(data: { name?: string; avatar_url?: string; password?: string }): Promise<User> {
    return request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getUsers(): Promise<User[]> {
    return request<User[]>("/users/");
  },

  async getUserSettings(): Promise<UserSettings> {
    return request<UserSettings>("/users/me/settings");
  },

  async updateUserSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    return request<UserSettings>("/users/me/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Groups
  async getGroups(): Promise<StudyGroup[]> {
    return request<StudyGroup[]>("/groups/");
  },

  async getGroup(id: string): Promise<StudyGroup> {
    return request<StudyGroup>(`/groups/${id}`);
  },

  async createGroup(data: { name: string; description?: string; subject?: string; visibility: string }): Promise<StudyGroup> {
    return request<StudyGroup>("/groups/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async joinGroup(id: string): Promise<StudyGroup> {
    return request<StudyGroup>(`/groups/${id}/join`, { method: "POST" });
  },

  async leaveGroup(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/groups/${id}/leave`, { method: "POST" });
  },

  // Nexconn
  async getNexconnToken(): Promise<NexconnToken> {
    return request<NexconnToken>("/nexconn/token", { method: "POST" });
  },

  // Notes
  async getNotes(): Promise<Note[]> {
    return request<Note[]>("/notes/");
  },

  async uploadNote(formData: FormData): Promise<Note> {
    return request<Note>("/notes/", {
      method: "POST",
      body: formData,
    });
  },

  async shareNote(noteId: string, data: { user_id?: string; group_id?: string }): Promise<NotePermission> {
    return request<NotePermission>(`/notes/${noteId}/share`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async downloadNoteUrl(noteId: string): Promise<Blob> {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/notes/${noteId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to download note or unauthorized");
    }
    return res.blob();
  },

  // AI Tutor
  async getConversations(): Promise<AIConversation[]> {
    return request<AIConversation[]>("/ai/conversations");
  },

  async getConversation(id: string): Promise<AIConversation> {
    return request<AIConversation>(`/ai/conversations/${id}`);
  },

  async askTutor(data: { question: string; conversation_id?: string }): Promise<{ conversation_id: string; question: string; answer: string }> {
    return request<{ conversation_id: string; question: string; answer: string }>("/ai/ask", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
