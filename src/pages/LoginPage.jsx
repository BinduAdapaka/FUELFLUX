import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

// Pre-configured demo accounts — create these once via /register with the matching role
const DEMO_ACCOUNTS = [
  { role: "user",    label: "User",            emoji: "👤", email: "demo.user@fuelflux.com",    password: "demo123", redirect: "/" },
  { role: "manager", label: "Station Manager", emoji: "🏪", email: "demo.manager@fuelflux.com", password: "demo123", redirect: "/inventory" },
  { role: "admin",   label: "Admin",           emoji: "🛡️", email: "demo.admin@fuelflux.com",   password: "demo123", redirect: "/admin" },
];

const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back! 👋");
      navigate("/");
    } catch (err) {
      const msg =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setDemoLoading(account.role);
    try {
      await login(account.email, account.password);
      toast.success(`Logged in as ${account.label} 🎉`);
      navigate(account.redirect);
    } catch {
      toast.error(`Demo account not set up yet. Register with ${account.email} as ${account.label} first.`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-decoration" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⛽</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to Fuel Flux</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-with-toggle">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? <LoadingSpinner /> : "Sign In"}
          </button>
        </form>

        {/* Demo Quick Login */}
        <div style={{ marginTop: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Quick Demo Login
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                id={`demo-login-${account.role}`}
                type="button"
                onClick={() => handleDemoLogin(account)}
                disabled={demoLoading !== null}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.65rem 0.25rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--card-bg)",
                  cursor: demoLoading !== null ? "not-allowed" : "pointer",
                  opacity: demoLoading !== null && demoLoading !== account.role ? 0.5 : 1,
                  transition: "all 0.2s ease",
                  color: "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (demoLoading === null) {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.background = "rgba(var(--accent-rgb, 234, 88, 12), 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--card-bg)";
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>
                  {demoLoading === account.role ? "⏳" : account.emoji}
                </span>
                <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                  {account.label}
                </span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.5rem" }}>
            Click a role to instantly log in with a demo account
          </p>
        </div>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
