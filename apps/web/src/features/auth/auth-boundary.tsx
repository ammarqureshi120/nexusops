"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./use-auth";

export function AuthBoundary({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.data === null) {
      router.replace("/signin");
    }
  }, [auth.data, router]);

  if (auth.isPending || auth.data === null) {
    return (
      <main className="status-screen" aria-live="polite">
        <span className="status-spinner" aria-hidden="true" />
        <p>
          {auth.isPending
            ? "Checking your session…"
            : "Redirecting to sign in…"}
        </p>
      </main>
    );
  }

  if (auth.isError) {
    return (
      <main className="status-screen">
        <div className="status-message" role="alert">
          <h1>We could not load your workspace.</h1>
          <p>Check your connection, then try again.</p>
          <button className="secondary-button" onClick={() => auth.refetch()}>
            Try again
          </button>
          <Link href="/signin">Return to sign in</Link>
        </div>
      </main>
    );
  }

  return children;
}
