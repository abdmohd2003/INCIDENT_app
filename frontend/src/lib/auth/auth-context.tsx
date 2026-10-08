"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
  type AuthRole,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth/session";
import { apiClient } from "@/lib/api/client";


import {
  connectSocket,
  disconnectSocket,
} from "@/lib/socket/socket-client";

type LoginCredentials = {
  email: string;
  password: string;
};

type RegistrationDetails = LoginCredentials & {
  name: string;
};

type LoginResponse = {
  user: {
    id: string;
    name?: string;
    email: string;
    role?: AuthRole;
  };
  token: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (details: RegistrationDetails) => Promise<void>;
  logout: () => void;
  hasRole: (roles: AuthRole | AuthRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSession = getStoredSession();

    setSession(storedSession);
    setIsLoading(false);
  }, []);

  const saveAuthResponse = useCallback((result: LoginResponse) => {
    if (
      !result ||
      !result.user ||
      !result.user.id ||
      !result.user.email ||
      !result.token
    ) {
      throw new Error("Invalid authentication response from server");
    }

    const user: AuthUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role ?? "RESPONDER",
    };

    const nextSession: AuthSession = { user, token: result.token };
    setStoredSession(nextSession);
    setSession(nextSession);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    saveAuthResponse(result);
  }, [saveAuthResponse]);

  const register = useCallback(async (details: RegistrationDetails) => {
    const result = await apiClient<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
      skipAuth: true,
    });

    saveAuthResponse(result);
  }, [saveAuthResponse]);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const hasRole = useCallback(
    (roles: AuthRole | AuthRole[]) => {
      if (!session) {
        return false;
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      return allowedRoles.includes(session.user.role);
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      register,
      logout,
      hasRole,
    }),
    [session, isLoading, login, register, logout, hasRole],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}