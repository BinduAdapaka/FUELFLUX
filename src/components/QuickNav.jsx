import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALL_LINKS = [
  { to: "/",          label: "Map View",       icon: "🗺️",  roles: ["user", null] },
  { to: "/order",     label: "Order Fuel",     icon: "⛽",  roles: ["user"] },
  { to: "/orders",    label: "My Orders",      icon: "📋",  roles: ["user"] },
  { to: "/vehicles",  label: "My Vehicles",    icon: "🚗",  roles: ["user"] },
  { to: "/inventory", label: "Fuel Inventory", icon: "📦",  roles: ["manager"] },
  { to: "/station",   label: "Station Info",   icon: "🏪",  roles: ["manager"] },
  { to: "/admin",     label: "Dashboard",      icon: "⚙️",  roles: ["admin"] },
  { to: "/login",     label: "Login",          icon: "🔐",  roles: [null] },
  { to: "/register",  label: "Sign Up",        icon: "✨",  roles: [null] },
];

const QuickNav = () => {
  const { user, role } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const currentRole = user ? (role ?? "user") : null;
  const links = ALL_LINKS.filter(l => l.roles.includes(currentRole));

  return (
    <div className="qnav-wrapper" ref={ref}>
      {/* Dropdown panel */}
      {open && (
        <div className="qnav-panel">
          <div className="qnav-panel-header">
            <div className="qnav-logo">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#1a1a1a"/>
                <path d="M16 4C16 4 10 10.5 10 16.5C10 20.1 11.8 22.5 14.2 23.5C13.6 21.8 14.2 20 16 18.8C17.8 17.6 18.5 15.8 18.5 15.8C18.5 15.8 20.5 18.2 18.5 20.8C20.5 20 22.5 17.5 22.5 15C22.5 10.8 19.5 7 16 4Z" fill="url(#qnGrad)"/>
                <defs>
                  <linearGradient id="qnGrad" x1="16" y1="4" x2="16" y2="23.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFC107"/><stop offset="1" stopColor="#FF5722"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="qnav-logo-text">Quick Nav</span>
            </div>
            <button className="qnav-close-btn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="qnav-divider" />

          <ul className="qnav-list">
            {links.map(({ to, label, icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`qnav-item ${location.pathname === to ? "qnav-item-active" : ""}`}
                >
                  <span className="qnav-item-icon">{icon}</span>
                  <span className="qnav-item-label">{label}</span>
                  {location.pathname === to && <span className="qnav-active-dot" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        className={`qnav-trigger ${open ? "qnav-trigger-open" : ""}`}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Quick navigation"
        id="quick-nav-btn"
      >
        <span className="qnav-bar" />
        <span className="qnav-bar" />
        <span className="qnav-bar" />
      </button>
    </div>
  );
};

export default QuickNav;
