import type { User } from "@prisma/client";

import type { SafeUser } from "./auth.types";

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("en-US");
}

export function toSafeUser(
  user: Pick<User, "id" | "email" | "displayName" | "createdAt">,
): SafeUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}
