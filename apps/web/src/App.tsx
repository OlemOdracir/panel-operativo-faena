import './App.css';

function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          PF
        </div>
        <div className="brand-copy">
          <strong>Panel Operativo de Faena</strong>
          <span>Monitoreo y gestión en terreno</span>
        </div>
        <span className="environment">Entorno local</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Base del proyecto preparada</p>
        <h1>Una vista operacional, desde los sensores hasta el trabajo en terreno.</h1>
        <p className="hero-copy">
          El repositorio ya cuenta con la infraestructura para construir el modelo de datos, la API
          y las pantallas por dominio.
        </p>
      </section>

      <section className="status-grid" aria-label="Estado inicial del proyecto">
        <article>
          <span className="step">01</span>
          <h2>Datos</h2>
          <p>PostgreSQL disponible para migraciones, relaciones y seed reproducible.</p>
          <span className="badge badge-ready">Preparado</span>
        </article>
        <article>
          <span className="step">02</span>
          <h2>API</h2>
          <p>NestJS con configuración validada, endpoint de salud y documentación Swagger.</p>
          <span className="badge badge-ready">Preparado</span>
        </article>
        <article>
          <span className="step">03</span>
          <h2>Panel</h2>
          <p>React Query y una estructura por capacidades para implementar las vistas.</p>
          <span className="badge badge-next">Siguiente etapa</span>
        </article>
      </section>
    </main>
  );
}

export default App;
