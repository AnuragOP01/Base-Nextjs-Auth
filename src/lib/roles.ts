export const userRoles = ["USER", "ADMIN"] as const;

export type UserRole = (typeof userRoles)[number];

export const dashboardPaths: Record<UserRole, string> = {
  USER: "/dashboard/user",
  ADMIN: "/dashboard/admin",
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.some((role) => role === value);
}
