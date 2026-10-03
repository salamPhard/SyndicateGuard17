import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <section className="landing-page">
      <div className="hero-panel">
        <p className="eyebrow homepage-brand">Syndicate_Guard_Group_17</p>
        <h1>Protect your APIs with smart traffic control</h1>
        <p className="subtitle">
          As APIs become the backbone of digital services, they are prime targets for abuse, DDoS attacks, and unexpected traffic spikes. Traditional rate limiting is often too rigid, frequently blocking legitimate users while failing against sophisticated threats.
        </p>
        <p className="subtitle">
          Smart traffic control modernizes API security by combining real-time analytics, adaptive rate limiting, and intelligent anomaly detection.
        </p>

        <div className="hero-actions">
          <details className="user-menu">
            <summary className="primary-btn">User</summary>
            <div className="user-menu-options">
              <Link to="/user-login">Login</Link>
              <Link to="/user-account">Register</Link>
            </div>
          </details>
          <Link to="/admin" className="secondary-btn">Admin portal</Link>
        </div>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <h2>User</h2>
          <p>Create accounts for regular users with a dedicated sign-up page.</p>
        </article>

        <article className="feature-card">
          <h2>Admin</h2>
          <p>Use the admin portal to sign in and view users and rate-limit rules.</p>
        </article>

        <article className="feature-card">
          <h2>Backend integration</h2>
          <p>Both pages connect to the Express API in the backend folder.</p>
        </article>
      </div>
    </section>
  )
}

export default HomePage
