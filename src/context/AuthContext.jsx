/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, getUserProfile } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState("user"); // "user" | "manager" | "admin"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setRole(profile?.role ?? "user");
        } catch {
          setRole("user");
        }
      } else {
        setRole("user");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin   = role === "admin";
  const isManager = role === "manager" || role === "admin"; // admin can do everything manager can

  return (
    <AuthContext.Provider value={{ user, role, loading, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
