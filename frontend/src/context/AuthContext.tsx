"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  theme: string;
  login: (username: string, password: string, tag?: string) => Promise<void>;
  register: (username: string, password: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  setTheme: (theme: string) => void;
  updateProfile: (data: { bio?: string; theme?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<string>("mint");

  // Load persisted session on boot
  useEffect(() => {
    const savedToken = localStorage.getItem("chatapp_token");
    const savedTheme = localStorage.getItem("chatapp_theme") || "mint";
    
    setThemeState(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    if (savedToken) {
      setToken(savedToken);
      api.auth
        .getMe(savedToken)
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            if (res.data.theme) {
              setThemeState(res.data.theme);
              document.documentElement.setAttribute("data-theme", res.data.theme);
            }
          }
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("chatapp_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("chatapp_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    if (token) {
      api.users.updateProfile({ theme: newTheme }, token).catch(() => {});
    }
  };

  const login = async (username: string, password: string, tag?: string) => {
    const res = await api.auth.login({ username, password, tag });
    if (res.success && res.data) {
      const { user: authUser, token: authToken } = res.data;
      setUser(authUser);
      setToken(authToken);
      localStorage.setItem("chatapp_token", authToken);
      if (authUser.theme) {
        setTheme(authUser.theme);
      }
    }
  };

  const register = async (username: string, password: string, avatarUrl?: string) => {
    const res = await api.auth.register({ username, password, avatarUrl });
    if (res.success && res.data) {
      const { user: authUser, token: authToken } = res.data;
      setUser(authUser);
      setToken(authToken);
      localStorage.setItem("chatapp_token", authToken);
    }
  };

  const logout = () => {
    localStorage.removeItem("chatapp_token");
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (data: { bio?: string; theme?: string; avatarUrl?: string }) => {
    if (!token) return;
    const res = await api.users.updateProfile(data, token);
    if (res.success && res.data) {
      setUser((prev) => (prev ? { ...prev, ...res.data } : null));
      if (data.theme) setTheme(data.theme);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        theme,
        login,
        register,
        logout,
        setTheme,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
