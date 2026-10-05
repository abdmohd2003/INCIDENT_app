import {
  clearStoredSession,
  getStoredSession,
} from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipAuth = false, ...requestOptions } = options;

  const headers = new Headers(requestOptions.headers);

  if (!headers.has("Content-Type") && requestOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const session = getStoredSession();

    if (session?.token) {
      headers.set("Authorization", `Bearer ${session.token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (response.status === 401) {
    clearStoredSession();

    if (typeof window !== "undefined") {
      const currentPath =
        window.location.pathname + window.location.search;

      if (currentPath !== "/login") {
        window.location.href = `/login?redirect=${encodeURIComponent(
          currentPath,
        )}`;
      }
    }

    throw new Error("Unauthorized");
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Request failed";

    throw new Error(message);
  }

  return data as T;
}