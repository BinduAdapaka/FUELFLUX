import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * allowedRoles: string[] — if provided, user must have one of these roles.
 * adminOnly: boolean — shorthand for allowedRoles=["admin"]
 * managerOnly: boolean — shorthand for allowedRoles=["admin","manager"]
 */
const ProtectedRoute = ({
  children,
  adminOnly   = false,
  managerOnly = false,
  allowedRoles,
}) => {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user)   return <Navigate to="/login" replace />;

  // Build effective role list
  const allowed = allowedRoles
    ?? (adminOnly   ? ["admin"]
      : managerOnly ? ["admin", "manager"]
      : null);

  if (allowed && !allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
