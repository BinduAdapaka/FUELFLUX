import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const ROLES = [
  {
    id: "user",
    label: "User",
    emoji: "👤",
    desc: "Order fuel, track deliveries, manage vehicles",
  },
  {
    id: "manager",
    label: "Station Manager",
    emoji: "🏪",
    desc: "Manage fuel inventory & pricing",
  },
  {
    id: "admin",
    label: "Admin",
    emoji: "🛡️",
    desc: "Full access: orders, users & analytics",
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName, role);
      toast.success("Account created! Welcome to Fuel Flux 🎉");
      // Redirect based on role
      if (role === "admin") navigate("/admin");
      else if (role === "manager") navigate("/inventory");
      else navigate("/");
    } catch (err) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "Email already registered"
          : err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-decoration" />

      <div className="auth-card" style={{ maxWidth: "480px" }}>
        <div className="auth-header">
          <div className="auth-logo">⛽</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Choose your role and join Fuel Flux</p>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p className="form-label" style={{ marginBottom: "0.75rem" }}>
            I am a…
          </p>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                id={`role-${r.id}`}
                onClick={() => setRole(r.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.75rem 0.4rem",
                  borderRadius: "12px",
                  border: `2px solid ${role === r.id ? "var(--accent)" : "var(--border)"}`,
                  background:
                    role === r.id
                      ? "rgba(var(--accent-rgb, 234, 88, 12), 0.12)"
                      : "var(--card-bg)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  color: role === r.id ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{r.emoji}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: role === r.id ? "var(--accent)" : "var(--text)",
                  }}
                >
                  {r.label}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    textAlign: "center",
                    lineHeight: 1.3,
                    color: "var(--text-muted)",
                  }}
                >
                  {r.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">
              Password
            </label>
            <div className="input-with-toggle">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading}
            id="register-submit-btn"
          >
            {loading ? <LoadingSpinner /> : `Create ${ROLES.find((r) => r.id === role)?.label} Account`}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
