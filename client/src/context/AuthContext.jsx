import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/users/me");
      setUser(data.user);
      connectSocket(token);
    } catch (err) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  async function register({ email, password, username }) {
    const { data } = await api.post("/auth/register", { email, password, username });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data.user;
  }

  async function login({ email, password }) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    disconnectSocket();
  }

  function updateLocalUser(patch) {
    setUser((prev) => ({ ...prev, ...patch }));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
