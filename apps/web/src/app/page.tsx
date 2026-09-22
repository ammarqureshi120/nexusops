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
        <span className="phase-label">Foundation · M0</span>
      </header>

      <section className="hero" id="main-content" aria-labelledby="hero-title">
        <p className="eyebrow">
          <span className="status-dot" aria-hidden="true" />
          Workspace foundation established
        </p>
        <h1 id="hero-title">
          Operations,
          <br />
          <span>connected.</span>
        </h1>
        <p className="hero-copy">
          NexusOps is being built as a calm, focused workspace for teams to
          coordinate projects and operational work with clarity.
        </p>
      </section>

      <footer className="site-footer">
        <p>Product capabilities arrive milestone by milestone.</p>
        <p>Next.js · NestJS · TypeScript</p>
      </footer>
    </main>
  );
}
