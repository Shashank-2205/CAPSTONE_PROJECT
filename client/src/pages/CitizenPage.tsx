type CitizenPageProps = {
  onBack: () => void
  onRequestHelp: () => void
  pageInfo: {
    heading: string
    subtitle: string
    points: string[]
    actions: Array<{ title: string; detail: string }>
  }
}

export default function CitizenPage({ onBack, onRequestHelp, pageInfo }: CitizenPageProps) {
  return (
    <main className="app-shell volunteer-page-shell">
      <div className="page-top-actions">
        <div className="page-header-back">
          <span className="page-role-tag">Citizen</span>
          <button type="button" className="secondary-btn" onClick={onBack}>Back to dashboard</button>
        </div>

        <div className="page-header-actions">
          <button type="button" className="primary-btn" onClick={onRequestHelp}>Request Help</button>
        </div>
      </div>

      <header className="topbar-shell">
        <nav className="topbar-nav" aria-label="Citizen navigation">
          <button type="button" className="topbar-tab active">Citizen</button>
        </nav>
      </header>

      <section className="hero-shell volunteer-hero">
        <div className="brand-wrap">
          <p className="eyebrow">Citizen</p>
          <h1>Citizen Response Center</h1>
        </div>
      </section>

      <section className="role-page-view" aria-live="polite">
        <div className="role-page-header">
          <div className="role-page-toolbar">
            <span className="eyebrow mini">Citizen console</span>
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
            <h3>Emergency overview</h3>
            <ul className="feature-list">
              {pageInfo.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="panel volunteer-panel accent-panel">
            <h3>Citizen actions</h3>
            <div className="cta-row stacked-actions">
              <button type="button" className="primary-btn">Report incident</button>
              <button type="button" className="secondary-btn">Check status</button>
              <button type="button" className="secondary-btn">Find shelter</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
