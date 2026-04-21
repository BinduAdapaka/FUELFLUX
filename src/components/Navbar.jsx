import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";
import toast from "react-hot-toast";

const ROLE_BADGE = {
  admin:   { label: "Admin",   color: "#FF9800" },
  manager: { label: "Manager", color: "#3b82f6" },
  user:    { label: "User",    color: "#94a3b8" },
};

const Navbar = () => {
  const { user, role, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Build nav links based on role
  const navLinks = [
    { to: "/",          label: "Map View",       icon: "🗺️", show: !user || role === "user" },
    { to: "/order",     label: "Order Fuel",     icon: "⛽", show: !!user && role === "user" },
    { to: "/orders",    label: "My Orders",      icon: "📋", show: !!user && role === "user" },
    { to: "/vehicles",  label: "My Vehicles",    icon: "🚗", show: !!user && role === "user" },
    { to: "/inventory", label: "Fuel Inventory", icon: "📦", show: role === "manager" },
    { to: "/station",   label: "Station Info",   icon: "🏪", show: role === "manager" },
    { to: "/admin",     label: "Dashboard",      icon: "⚙️", show: isAdmin },
    { to: "/login",     label: "Login",          icon: "🔐", show: !user },
    { to: "/register",  label: "Sign Up",        icon: "✨", show: !user },
  ].filter((l) => l.show);

  const badge = user ? ROLE_BADGE[role] ?? ROLE_BADGE.user : null;

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <Link
          to={role === "manager" ? "/inventory" : role === "admin" ? "/admin" : "/"}
          className="brand-link"
        >
          <div className="brand-logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#1a1a1a"/>
              <path
                d="M16 4C16 4 10 10.5 10 16.5C10 20.1 11.8 22.5 14.2 23.5C13.6 21.8 14.2 20 16 18.8C17.8 17.6 18.5 15.8 18.5 15.8C18.5 15.8 20.5 18.2 18.5 20.8C20.5 20 22.5 17.5 22.5 15C22.5 10.8 19.5 7 16 4Z"
                fill="url(#flameGradNav)"
              />
              <defs>
                <linearGradient id="flameGradNav" x1="16" y1="4" x2="16" y2="23.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFC107"/>
                  <stop offset="0.5" stopColor="#FF9800"/>
                  <stop offset="1" stopColor="#FF5722"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-name">Fuel<span className="brand-accent">Flux</span></span>
        </Link>
      </div>

      {/* Right side: user info + hamburger menu */}
      <div className="navbar-right">
        {/* User greeting + badge (desktop) */}
        {user && (
          <div className="nav-user-info nav-user-info--desktop">
            <span className="nav-greeting">
              {user.displayName || user.email.split("@")[0]}
            </span>
            {badge && (
              <span
                className="nav-role-badge"
                style={{
                  background: badge.color + "22",
                  color: badge.color,
                  borderColor: badge.color + "55",
                }}
              >
                {badge.label}
              </span>
            )}
          </div>
        )}

        {/* Hamburger button */}
        <div className="nav-hamburger-wrap" ref={menuRef}>
          <button
            className={`nav-hamburger-btn ${menuOpen ? "nav-hamburger-btn--open" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            id="nav-hamburger-btn"
          >
            <span className="nav-hbar" />
            <span className="nav-hbar" />
            <span className="nav-hbar" />
          </button>

          {/* Dropdown panel */}
          {menuOpen && (
            <div className="nav-dropdown">
              {/* Section label */}
              <div className="nav-dropdown-section-label">Navigation</div>

              {navLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`nav-dropdown-item ${location.pathname === to ? "nav-dropdown-item--active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nav-dropdown-icon">{icon}</span>
                  <span className="nav-dropdown-label">{label}</span>
                  {location.pathname === to && <span className="nav-dropdown-dot" />}
                </Link>
              ))}

              {/* Divider + account actions */}
              {user && (
                <>
                  <div className="nav-dropdown-divider" />
                  <div className="nav-dropdown-section-label">Account</div>
                  <button
                    className="nav-dropdown-item nav-dropdown-logout"
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                  >
                    <span className="nav-dropdown-icon">🚪</span>
                    <span className="nav-dropdown-label">Logout</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
