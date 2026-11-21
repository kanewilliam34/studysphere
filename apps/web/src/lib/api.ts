const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

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

// Resilient Demo Data Store for Cloud Preview when local backend is unreachable
function getDemoDb() {
  if (typeof window === "undefined") {
    return {
      users: {} as Record<string, User>,
      currentUser: null as User | null,
      groups: [] as StudyGroup[],
      notes: [] as Note[],
      conversations: [] as AIConversation[],
    };
  }

  const defaultGroups: StudyGroup[] = [
    {
      id: "grp-cs101",
      owner_id: "demo-owner-1",
      name: "CS101: Intro to Computer Science",
      description: "Python, algorithmic thinking, and computational problem solving.",
      subject: "Computer Science",
      visibility: "public",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      member_count: 14,
      is_member: true,
      user_role: "member",
      nexconn_channel_id: "grp-cs101",
    },
    {
      id: "grp-dsa",
      owner_id: "demo-owner-2",
      name: "Data Structures & Algorithms",
      description: "Trees, graphs, dynamic programming, and asymptotic complexity analysis.",
      subject: "Computer Science",
      visibility: "public",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      member_count: 22,
      is_member: true,
      user_role: "admin",
      nexconn_channel_id: "grp-dsa",
    },
    {
      id: "grp-calc2",
      owner_id: "demo-owner-3",
      name: "Calculus II Study Cohort",
      description: "Integration techniques, infinite series, Taylor polynomials, and parametric curves.",
      subject: "Mathematics",
      visibility: "public",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      member_count: 9,
      is_member: false,
      user_role: null,
      nexconn_channel_id: "grp-calc2",
    },
    {
      id: "grp-quantum",
      owner_id: "demo-owner-4",
      name: "Quantum Physics & Mechanics",
      description: "Wave-particle duality, Schrödinger equation, and quantum superposition.",
      subject: "Physics",
      visibility: "public",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      member_count: 6,
      is_member: false,
      user_role: null,
      nexconn_channel_id: "grp-quantum",
    },
  ];

  const defaultNotes: Note[] = [
    {
      id: "note-1",
      owner_id: "demo-owner-1",
      title: "Lecture 04 - Graph Algorithms & BFS/DFS.pdf",
      description: "Comprehensive notes with adjacency list diagrams and time complexity proofs.",
      file_key: "notes/sample_graphs.pdf",
      mime_type: "application/pdf",
      file_size: 2450000,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      owner_name: "Alice Johnson",
    },
    {
      id: "note-2",
      owner_id: "demo-owner-3",
      title: "Calculus Integration Cheat Sheet.pdf",
      description: "Integration by parts, trigonometric substitutions, and partial fractions.",
      file_key: "notes/sample_calc.pdf",
      mime_type: "application/pdf",
      file_size: 1120000,
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      owner_name: "Charlie",
    },
  ];

  const defaultConversations: AIConversation[] = [
    {
      id: "conv-1",
      user_id: "demo-user",
      title: "Understanding Binary Search Trees",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      messages: [
        {
          id: "m-1",
          conversation_id: "conv-1",
          role: "user",
          content: "What is the worst-case time complexity of searching in a BST?",
          created_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: "m-2",
          conversation_id: "conv-1",
          role: "assistant",
          content:
            "Great question! In a balanced binary search tree (like an AVL or Red-Black tree), search takes O(log n) time because each comparison cuts the search space in half.\n\nHowever, in an unbalanced or degenerate BST—for instance, if you insert already-sorted elements (1, 2, 3, 4, 5)—the tree degrades into a linked list! In that worst case, the height becomes n, making search complexity O(n).\n\nWhat mechanism can you use to ensure the tree maintains an O(log n) height?",
          created_at: new Date(Date.now() - 3400000).toISOString(),
        },
      ],
    },
  ];

  try {
    const raw = localStorage.getItem("studysphere_demo_db_v2");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  const initial = {
    users: {
      "alice.demo@studysphere.org": {
        id: "d1d7e7a7-67f6-4d80-bde1-52991cf90244",
        name: "Alice Johnson",
        email: "alice.demo@studysphere.org",
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
      "bob.demo@studysphere.org": {
        id: "d540804b-6c38-4da6-986c-660740dac7df",
        name: "Bob Smith",
        email: "bob.demo@studysphere.org",
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
    },
    currentUser: null,
    groups: defaultGroups,
    notes: defaultNotes,
    conversations: defaultConversations,
  };

  try {
    localStorage.setItem("studysphere_demo_db_v2", JSON.stringify(initial));
  } catch {}

  return initial;
}

function saveDemoDb(db: any) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("studysphere_demo_db_v2", JSON.stringify(db));
    } catch {}
  }
}

function fallbackHandler<T>(endpoint: string, options: RequestInit = {}): T {
  const db = getDemoDb();
  const method = (options.method || "GET").toUpperCase();

  // Auth: Register
  if (endpoint === "/auth/register" && method === "POST") {
    const body = JSON.parse((options.body as string) || "{}");
    const user: User = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      name: body.name || "Student User",
      email: body.email,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    db.users[user.email] = user;
    db.currentUser = user;
    saveDemoDb(db);
    return {
      access_token: "demo_jwt_token_" + Date.now(),
      refresh_token: "demo_refresh_token_" + Date.now(),
      user,
    } as T;
  }

  // Auth: Login
  if (endpoint === "/auth/login" && method === "POST") {
    const body = JSON.parse((options.body as string) || "{}");
    let user = db.users[body.email];
    if (!user) {
      user = {
        id: "usr-" + Math.random().toString(36).substring(2, 9),
        name: body.email.split("@")[0].replace(".", " "),
        email: body.email,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      db.users[user.email] = user;
    }
    db.currentUser = user;
    saveDemoDb(db);
    return {
      access_token: "demo_jwt_token_" + Date.now(),
      refresh_token: "demo_refresh_token_" + Date.now(),
      user,
    } as T;
  }

  // Auth: Logout
  if (endpoint === "/auth/logout") {
    db.currentUser = null;
    saveDemoDb(db);
    return { message: "Logged out" } as T;
  }

  // Profile: Me
  if (endpoint === "/users/me" && method === "GET") {
    if (db.currentUser) return db.currentUser as T;
    const defaultUser: User = {
      id: "d1d7e7a7-67f6-4d80-bde1-52991cf90244",
      name: "Alice Johnson",
      email: "alice.demo@studysphere.org",
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    return defaultUser as T;
  }

  // User Settings
  if (endpoint === "/users/me/settings") {
    return {
      id: "settings-demo",
      user_id: db.currentUser?.id || "demo-user",
      theme: "system",
      language: "en",
      notifications: true,
    } as T;
  }

  // Nexconn Token
  if (endpoint === "/nexconn/token") {
    return {
      app_key: "studysphere_app_key_placeholder",
      user_id: db.currentUser?.id || "d1d7e7a7-67f6-4d80-bde1-52991cf90244",
      access_token: "simulated_nexconn_token_" + Date.now(),
      base_url: "https://api.sg-light-api.com",
      is_simulated: true,
    } as T;
  }

  // Study Groups
  if (endpoint === "/groups/" && method === "GET") {
    return db.groups as T;
  }

  if (endpoint === "/groups/" && method === "POST") {
    const body = JSON.parse((options.body as string) || "{}");
    const newGroup: StudyGroup = {
      id: "grp-" + Math.random().toString(36).substring(2, 9),
      owner_id: db.currentUser?.id || "demo-user",
      name: body.name,
      description: body.description || "",
      subject: body.subject || "General",
      visibility: body.visibility || "public",
      created_at: new Date().toISOString(),
      member_count: 1,
      is_member: true,
      user_role: "admin",
      nexconn_channel_id: "grp-" + Math.random().toString(36).substring(2, 9),
    };
    db.groups.unshift(newGroup);
    saveDemoDb(db);
    return newGroup as T;
  }

  if (endpoint.startsWith("/groups/") && endpoint.endsWith("/join")) {
    const groupId = endpoint.split("/")[2];
    const grp = db.groups.find((g: StudyGroup) => g.id === groupId);
    if (grp) {
      grp.is_member = true;
      grp.member_count += 1;
      grp.user_role = "member";
      saveDemoDb(db);
      return grp as T;
    }
  }

  if (endpoint.startsWith("/groups/") && endpoint.endsWith("/leave")) {
    const groupId = endpoint.split("/")[2];
    const grp = db.groups.find((g: StudyGroup) => g.id === groupId);
    if (grp) {
      grp.is_member = false;
      grp.member_count = Math.max(0, grp.member_count - 1);
      grp.user_role = null;
      saveDemoDb(db);
      return { message: "Left group successfully" } as T;
    }
  }

  if (endpoint.startsWith("/groups/")) {
    const groupId = endpoint.replace("/groups/", "");
    const grp = db.groups.find((g: StudyGroup) => g.id === groupId);
    if (grp) return grp as T;
    return db.groups[0] as T;
  }

  // Notes
  if (endpoint === "/notes/" && method === "GET") {
    return db.notes as T;
  }

  if (endpoint === "/notes/" && method === "POST") {
    let title = "Uploaded Note.pdf";
    let description = "Uploaded study note";
    if (options.body instanceof FormData) {
      const file = options.body.get("file") as File | null;
      if (file) title = file.name;
      description = (options.body.get("description") as string) || description;
    }
    const newNote: Note = {
      id: "note-" + Math.random().toString(36).substring(2, 9),
      owner_id: db.currentUser?.id || "demo-user",
      title,
      description,
      file_key: "notes/" + Math.random().toString(36).substring(2, 9) + ".pdf",
      mime_type: "application/pdf",
      file_size: 1540000,
      created_at: new Date().toISOString(),
      owner_name: db.currentUser?.name || "Student User",
    };
    db.notes.unshift(newNote);
    saveDemoDb(db);
    return newNote as T;
  }

  // AI Conversations
  if (endpoint === "/ai/conversations" && method === "GET") {
    return db.conversations as T;
  }

  if (endpoint.startsWith("/ai/conversations/")) {
    const convId = endpoint.replace("/ai/conversations/", "");
    const conv = db.conversations.find((c: AIConversation) => c.id === convId);
    if (conv) return conv as T;
    return db.conversations[0] as T;
  }

  // AI Ask
  if (endpoint === "/ai/ask" && method === "POST") {
    const body = JSON.parse((options.body as string) || "{}");
    const q = (body.question || "").toLowerCase();
    let answer = `You asked: "${body.question}". In this conceptual domain, let's break down the problem into first principles:\n\n1. What are the key constraints and known variables given in your problem?\n2. What mathematical or algorithmic invariant must hold true at every transition step?\n\nTake a moment to formulate your hypothesis on the first step, and tell me where you'd like to begin!`;

    if (q.includes("binary") || q.includes("tree") || q.includes("bst")) {
      answer = `A Binary Search Tree relies on the invariant that every node in the left subtree has a key strictly less than the root, and the right subtree has keys greater. \n\nWhen we analyze time complexity, think about how the tree's height governs the maximum number of pointer traversals. What happens to that height if values are inserted in ascending order?`;
    } else if (q.includes("time") || q.includes("complexity") || q.includes("big o")) {
      answer = `To determine time complexity using Big-O notation, count the fundamental operations as an asymptotic function of input size n.\n\nAsk yourself: Does this operation divide the problem size in half each time (logarithmic), visit each element once (linear), or compare every pair (quadratic)?`;
    }

    const conversationId = body.conversation_id || "conv-" + Date.now();
    return {
      conversation_id: conversationId,
      question: body.question,
      answer,
    } as T;
  }

  return {} as T;
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

  // Normalize endpoint to remove trailing slash so Next.js doesn't issue a 308 redirect
  const normalizedEndpoint = endpoint.length > 1 && endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;

  try {
    const res = await fetch(`${API_BASE}${normalizedEndpoint}`, {
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

    return (await res.json()) as T;
  } catch (error: any) {
    // If backend is unreachable or CORS blocked on public Vercel deployment
    if (
      error.name === "TypeError" ||
      error.message?.includes("fetch") ||
      error.message?.includes("NetworkError") ||
      error.message?.includes("Failed to fetch")
    ) {
      console.info(`[StudySphere Resilient Demo Mode] Serving ${endpoint} via client fallback`);
      return fallbackHandler<T>(endpoint, options);
    }
    throw error;
  }
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
    try {
      const res = await fetch(`${API_BASE}/notes/${noteId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to download note or unauthorized");
      }
      return res.blob();
    } catch {
      // In demo mode return a sample PDF blob
      return new Blob(["%PDF-1.4 Mock StudySphere Note Content"], { type: "application/pdf" });
    }
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
