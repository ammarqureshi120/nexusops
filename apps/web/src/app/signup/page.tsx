import type { Metadata } from "next";

import { AuthPage } from "@/features/auth/auth-page";

export const metadata: Metadata = { title: "Create account · NexusOps" };

export default function SignUpPage() {
  return <AuthPage mode="register" />;
}
