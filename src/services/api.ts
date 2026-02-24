export interface User {
  id: number;
  username: string;
}

export interface Preferences {
  default_style: string;
  auto_save: number;
}

export interface SavedImage {
  id: number;
  url: string;
  style_id: string;
  created_at: string;
}

export const api = {
  async getMe(): Promise<User | null> {
    const res = await fetch("/api/auth/me");
    return res.json();
  },

  async login(username: string, password: string): Promise<User> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  async register(username: string, password: string): Promise<User> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  async logout() {
    await fetch("/api/auth/logout", { method: "POST" });
  },

  async getPreferences(): Promise<Preferences> {
    const res = await fetch("/api/user/preferences");
    return res.json();
  },

  async updatePreferences(prefs: Preferences) {
    await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  },

  async getImages(): Promise<SavedImage[]> {
    const res = await fetch("/api/images");
    return res.json();
  },

  async saveImage(url: string, style_id: string) {
    await fetch("/api/images/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, style_id }),
    });
  },

  async deleteImage(id: number) {
    await fetch(`/api/images/${id}`, { method: "DELETE" });
  },
};
