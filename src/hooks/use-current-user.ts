"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
};

export function useCurrentUser(): CurrentUser | null {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    role: user.role ?? null,
  };
}
