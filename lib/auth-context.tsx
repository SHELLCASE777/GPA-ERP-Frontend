"use client";

import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from "react";
import { authApi } from "./api";
import type { AppMenuPermission, RoleName, User } from "./types";

interface AuthState {
  user: User | null;
  token: string | null;
  allowedMenuKeys: string[];
  menus: AppMenuPermission[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  canAccessMenu: (key: string) => boolean;
  firstAllowedPath: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    allowedMenuKeys: [],
    menus: [],
    isLoading: true,
    isAuthenticated: false,
  });

  const loadUser = useCallback(async (token: string) => {
    try {
      const [{ data: user }, { data: menuPermissions }] = await Promise.all([
        authApi.me(),
        authApi.menuPermissions(),
      ]);
      setState({
        user,
        token,
        allowedMenuKeys: menuPermissions.allowed_keys,
        menus: menuPermissions.menus,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem("gpa_token");
      setState({
        user: null,
        token: null,
        allowedMenuKeys: [],
        menus: [],
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("gpa_token");
    if (saved) {
      loadUser(saved);
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem("gpa_token", data.access_token);
    await loadUser(data.access_token);
  }, [loadUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("gpa_token");
    setState({
      user: null,
      token: null,
      allowedMenuKeys: [],
      menus: [],
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("gpa_token");
    if (token) await loadUser(token);
  }, [loadUser]);

  const canAccessMenu = useCallback((key: string) => {
    if (state.user?.role.name === "SUPER_ADMIN") return true;
    return state.allowedMenuKeys.includes(key);
  }, [state.allowedMenuKeys, state.user]);

  const firstAllowedPath = useCallback(() => {
    const first = state.menus.find((menu) => menu.can_access && menu.path && !menu.path.startsWith("/admin"));
    return first?.path ?? "/dashboard";
  }, [state.menus]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, canAccessMenu, firstAllowedPath }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("No authenticated user");
  return user;
}

// ─── Role hook ────────────────────────────────────────────────────────────────

export function useRole() {
  const { user } = useAuth();
  const role = user?.role.name ?? null;

  const hasRole = (...roles: RoleName[]): boolean =>
    role !== null && roles.includes(role);

  const isSuperAdmin = hasRole("SUPER_ADMIN");
  const isMD         = hasRole("MD", "SUPER_ADMIN");
  const isPM         = hasRole("PM", "MD", "SUPER_ADMIN");
  const isCostControl= hasRole("COST_CONTROL", "SUPER_ADMIN");
  const isFinance    = hasRole("FINANCE", "SUPER_ADMIN");

  // Can sign legal documents (MD, PM, or Super Admin)
  const canSign = hasRole("MD", "PM", "SUPER_ADMIN");

  return { role, hasRole, isSuperAdmin, isMD, isPM, isCostControl, isFinance, canSign };
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

export function ProtectedRoute({
  children,
  roles,
  fallback = null,
}: {
  children: React.ReactNode;
  roles?: RoleName[];
  fallback?: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <>{fallback}</>;
  if (roles && user && !roles.includes(user.role.name)) return <>{fallback}</>;
  return <>{children}</>;
}
