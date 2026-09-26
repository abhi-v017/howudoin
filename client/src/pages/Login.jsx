import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface rounded-[2rem] p-8 shadow-clay-card backdrop-blur-xl border border-white/10">
        <h1 className="text-2xl font-bold text-center mb-2 text-text">Welcome back</h1>
        <p className="text-sm text-text-muted text-center mb-8">
          Log in to continue chatting anonymously
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border shadow-clay-input text-text placeholder-text-muted text-sm focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border shadow-clay-input text-text placeholder-text-muted text-sm focus:outline-none"
          />

          {error && <p className="text-xs text-red-400 px-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-2xl bg-primary text-bubbleMe-text text-sm font-semibold shadow-clay-btn hover:shadow-clay-btn-active transition disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
