import type { Metadata } from "next";

import { AuthPage } from "@/features/auth/auth-page";

export const metadata: Metadata = { title: "Sign in · NexusOps" };

export default function SignInPage() {
  return <AuthPage mode="login" />;
}
