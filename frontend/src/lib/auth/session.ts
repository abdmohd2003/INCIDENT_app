export type AuthRole = "ADMIN" | "RESPONDER" | "VIEWER";

export type AuthUser = {
  id: string;
  name?: string;
  email: string;
  role: AuthRole;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

const SESSION_KEY = "incident-auth-session";

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setStoredSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  window.document.cookie = `${SESSION_KEY}=; Max-Age=0; path=/; SameSite=Lax`;
}