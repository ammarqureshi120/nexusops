import Link from "next/link";

export default function Home() {
  return (
    <main className="foundation-shell">
      <header className="site-header" aria-label="NexusOps">
        <a className="wordmark" href="#main-content" aria-label="NexusOps home">
          <span className="wordmark-mark" aria-hidden="true">
            N
          </span>
          <span>NexusOps</span>
        </a>
        <nav className="public-nav" aria-label="Account">
          <Link className="quiet-link" href="/signin">
            Sign in
          </Link>
          <Link className="small-primary-link" href="/signup">
            Create account
          </Link>
        </nav>
      </header>

      <section className="hero" id="main-content" aria-labelledby="hero-title">
        <p className="eyebrow">
          <span className="status-dot" aria-hidden="true" />
          Built for focused operations
        </p>
        <h1 id="hero-title">
          Operations,
          <br />
          <span>connected.</span>
        </h1>
        <p className="hero-copy">
          A calm, structured workspace for teams to coordinate ownership and
          operational work with clarity.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/signup">
            Create your account
          </Link>
          <Link className="secondary-link" href="/signin">
            Sign in
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <p>NexusOps identity foundation</p>
        <p>Next.js · NestJS · PostgreSQL</p>
      </footer>
    </main>
  );
}
