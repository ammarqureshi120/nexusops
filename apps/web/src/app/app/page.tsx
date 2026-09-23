"use client";

import { LogoutButton } from "@/features/auth/logout-button";
import { useAuth } from "@/features/auth/use-auth";

export default function ApplicationHome() {
  const { data: user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="#workspace">
          <span className="wordmark-mark" aria-hidden="true">
            N
          </span>
          <span>NexusOps</span>
        </a>
        <div className="account-summary">
          <span>{user.displayName}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="app-content" id="workspace">
        <p className="eyebrow">
          <span className="status-dot" aria-hidden="true" />
          Secure session active
        </p>
        <h1>Welcome, {user.displayName.split(" ")[0]}.</h1>
        <p className="app-lead">
          Your NexusOps identity is ready. Organization and project workspaces
          will be introduced in the next product milestones.
        </p>
        <section className="account-panel" aria-labelledby="account-title">
          <div>
            <p className="section-kicker">Account</p>
            <h2 id="account-title">Signed-in identity</h2>
          </div>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{user.displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
