import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiBase } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check both storages — localStorage for "Remember Me" sessions, sessionStorage for non-persistent
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken) => {
    try {
      const response = await fetch(`${apiBase}/api/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setNeedsProfile(!data.user.name);
      } else {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setToken(null);
      }
    } catch {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData, authToken, profileNeeded = false, rememberMe = true) => {
    setUser(userData);
    setToken(authToken);
    setNeedsProfile(profileNeeded);
    if (rememberMe) {
      localStorage.setItem("token", authToken);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", authToken);
      localStorage.removeItem("token");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setNeedsProfile(false);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setLocation("/login");
  };

  const updateUser = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
    if (updates.name) {
      setNeedsProfile(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!token,
        needsProfile,
        login,
        logout,
        updateUser,
        token,
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
