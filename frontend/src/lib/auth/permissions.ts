import type { AuthRole } from "@/lib/auth/session";

export function canAccess(
  role: AuthRole | null | undefined,
  allowedRoles: AuthRole | AuthRole[],
): boolean {
  if (!role) {
    return false;
  }

  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  return roles.includes(role);
}