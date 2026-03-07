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

/**
 * Returns true if the user has completed onboarding, meaning they have
 * at least one of STUDENT, MENTOR, or ADMIN role.
 * A user with only the default "USER" role has NOT completed onboarding.
 */
export function hasCompletedOnboarding(
  publicMetadata: Record<string, unknown> | undefined,
): boolean {
  const roles = getRoles(publicMetadata);
  return roles.some((r) => r === "STUDENT" || r === "MENTOR" || r === "ADMIN");
}
