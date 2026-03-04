import type { UserRole } from "@/types";

/**
 * Extract the roles array from Clerk publicMetadata.
 * Handles both `roles: ["ADMIN"]` (array) and `role: "admin"` (legacy string) shapes.
 * Always returns uppercase role strings.
 */
export function getRoles(
  publicMetadata: Record<string, unknown> | undefined,
): UserRole[] {
  if (!publicMetadata) return [];

  // Preferred: `roles` as array
  if (Array.isArray(publicMetadata.roles)) {
    return (publicMetadata.roles as string[])
      .filter((r) => typeof r === "string" && r.trim() !== "")
      .map((r) => r.toUpperCase() as UserRole);
  }

  // Legacy: single `role` string
  if (
    typeof publicMetadata.role === "string" &&
    publicMetadata.role.trim() !== ""
  ) {
    return [publicMetadata.role.toUpperCase() as UserRole];
  }

  return [];
}

/**
 * Check if the user has a specific role.
 */
export function hasRole(
  publicMetadata: Record<string, unknown> | undefined,
  role: UserRole,
): boolean {
  return getRoles(publicMetadata).includes(role);
}

export function isAdmin(
  publicMetadata: Record<string, unknown> | undefined,
): boolean {
  return hasRole(publicMetadata, "ADMIN");
}

export function isMentor(
  publicMetadata: Record<string, unknown> | undefined,
): boolean {
  return hasRole(publicMetadata, "MENTOR");
}

export function isStudent(
  publicMetadata: Record<string, unknown> | undefined,
): boolean {
  return hasRole(publicMetadata, "STUDENT");
}
