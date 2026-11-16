const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<{ success: boolean; data: T; message?: string }> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "An unexpected error occurred");
  }

  return json;
}

export const api = {
  auth: {
    register: (body: { email: string; username: string; password: string; avatarUrl?: string }) =>
      apiRequest<{ user: any; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { identifier: string; password: string }) =>
      apiRequest<{ user: any; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    googleLogin: (credential: string) =>
      apiRequest<{ user: any; token: string }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      }),
    getMe: (token: string) =>
      apiRequest<any>("/auth/me", { method: "GET" }, token),
  },

  users: {
    search: (query: string, token: string) =>
      apiRequest<any[]>(`/users/search?query=${encodeURIComponent(query)}`, { method: "GET" }, token),
    getProfile: (userId: string, token: string) =>
      apiRequest<any>(`/users/${userId}`, { method: "GET" }, token),
    updateProfile: (body: { username?: string; bio?: string; theme?: string; avatarUrl?: string }, token: string) =>
      apiRequest<any>("/users/profile", {
        method: "PATCH",
        body: JSON.stringify(body),
      }, token),
  },

  conversations: {
    list: (token: string) =>
      apiRequest<any[]>("/conversations", { method: "GET" }, token),
    getOrCreateDirect: (body: { recipientId?: string; recipientUsername?: string; recipientTag?: string }, token: string) =>
      apiRequest<any>("/conversations/direct", {
        method: "POST",
        body: JSON.stringify(body),
      }, token),
    createGroup: (body: { title: string; description?: string; avatarUrl?: string; memberIds?: string[] }, token: string) =>
      apiRequest<any>("/conversations/group", {
        method: "POST",
        body: JSON.stringify(body),
      }, token),
    getDetails: (conversationId: string, token: string) =>
      apiRequest<any>(`/conversations/${conversationId}`, { method: "GET" }, token),
  },

  messages: {
    list: (conversationId: string, token: string, cursor?: string) =>
      apiRequest<{ messages: any[]; nextCursor: string | null }>(
        `/messages/${conversationId}${cursor ? `?cursor=${cursor}` : ""}`,
        { method: "GET" },
        token
      ),
    send: (body: { conversationId: string; content?: string; type?: string; mediaUrl?: string }, token: string) =>
      apiRequest<any>("/messages", {
        method: "POST",
        body: JSON.stringify(body),
      }, token),
    markAsRead: (conversationId: string, token: string) =>
      apiRequest<any>(`/messages/${conversationId}/read`, { method: "POST" }, token),
  },

  media: {
    upload: async (file: File, token: string) => {
      const formData = new FormData();
      formData.append("file", file);

      return apiRequest<any>("/media/upload", {
        method: "POST",
        body: formData,
      }, token);
    },
  },
};
