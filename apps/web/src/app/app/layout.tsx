import { AuthBoundary } from "@/features/auth/auth-boundary";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthBoundary>{children}</AuthBoundary>;
}
