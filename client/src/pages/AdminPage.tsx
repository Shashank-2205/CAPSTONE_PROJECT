type AdminPageProps = {
  onBack: () => void
  onRequestHelp: () => void
  pageInfo: {
    heading: string
    subtitle: string
    points: string[]
    actions: Array<{ title: string; detail: string }>
  }
}

export default function AdminPage({ onBack, onRequestHelp, pageInfo }: AdminPageProps) {
  return (
    <main className="app-shell volunteer-page-shell">
      <div className="page-top-actions">
        <div className="page-header-back">
          <span className="page-role-tag">Admin</span>
          <button type="button" className="secondary-btn" onClick={onBack}>Back to dashboard</button>
        </div>

        <div className="page-header-actions">
          <button type="button" className="primary-btn" onClick={onRequestHelp}>Request Help</button>
        </div>
      </div>

      <header className="topbar-shell">
        <nav className="topbar-nav" aria-label="Admin navigation">
          <button type="button" className="topbar-tab active">Admin</button>
        </nav>
      </header>

      <section className="hero-shell volunteer-hero">
        <div className="brand-wrap">
          <p className="eyebrow">Admin</p>
          <h1>Command Control Center</h1>
        </div>
      </section>

      <section className="role-page-view" aria-live="polite">
        <div className="role-page-header">
          <div className="role-page-toolbar">
            <span className="eyebrow mini">Admin console</span>
          </div>
          <h2>{pageInfo.heading}</h2>
          <p>{pageInfo.subtitle}</p>
        </div>

        <div className="role-page-grid">
          {pageInfo.actions.map((action) => (
            <div className="card" key={action.title}>
              <h3>{action.title}</h3>
              <ul>
                <li>{action.detail}</li>
              </ul>
            </div>
          ))}
        </div>

        <div className="volunteer-section-grid">
          <div className="panel volunteer-panel">
            <h3>Operations overview</h3>
            <ul className="feature-list">
              {pageInfo.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="panel volunteer-panel accent-panel">
            <h3>Command actions</h3>
            <div className="cta-row stacked-actions">
              <button type="button" className="primary-btn">Deploy team</button>
              <button type="button" className="secondary-btn">Review analytics</button>
              <button type="button" className="secondary-btn">Send alert</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
