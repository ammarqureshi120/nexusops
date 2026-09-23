import Link from "next/link";

import { AuthForm } from "./auth-form";

export function AuthPage({ mode }: Readonly<{ mode: "login" | "register" }>) {
  const isRegister = mode === "register";
  return (
    <main className="auth-shell">
      <section className="auth-context" aria-labelledby="auth-context-title">
        <Link className="wordmark auth-wordmark" href="/">
          <span className="wordmark-mark" aria-hidden="true">
            N
          </span>
          <span>NexusOps</span>
        </Link>
        <div>
          <p className="eyebrow">Operations, connected</p>
          <h1 id="auth-context-title">Keep work moving with clarity.</h1>
          <p>
            One calm workspace for teams to coordinate ownership and operational
            work.
          </p>
        </div>
        <p className="context-footnote">
          Secure, focused, and built for teams.
        </p>
      </section>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-card">
          <div className="auth-heading">
            <p className="section-kicker">
              {isRegister ? "Get started" : "Welcome back"}
            </p>
            <h2 id="auth-title">
              {isRegister ? "Create your account" : "Sign in to NexusOps"}
            </h2>
            <p>
              {isRegister
                ? "Set up your secure NexusOps identity."
                : "Continue to your operations workspace."}
            </p>
          </div>
          <AuthForm mode={mode} />
        </div>
      </section>
    </main>
  );
}
