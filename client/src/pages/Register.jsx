import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface rounded-[2rem] p-8 shadow-clay-card backdrop-blur-xl border border-white/10">
        <h1 className="text-2xl font-bold text-center mb-2 text-text">Create your account</h1>
        <p className="text-sm text-text-muted text-center mb-8">
          You'll get a random 6-character UID — others can find you by it without ever seeing your email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            minLength={2}
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border shadow-clay-input text-text placeholder-text-muted text-sm focus:outline-none"
          />
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
            minLength={6}
            placeholder="Password (min 6 characters)"
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
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
