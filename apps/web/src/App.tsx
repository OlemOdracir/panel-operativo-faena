import './App.css';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { IncidentResponse, UserResponse, WorkOrderResponse } from '@faena/contracts';
import { ApiError, api, type Team } from './api';

function App() {
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false });
  if (me.isPending)
    return <PageMessage title="Cargando sesión" text="Verificando tu acceso al panel." />;
  if (me.isError) return <LoginPage />;
  return <Panel user={me.data} />;
}

function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [email, setEmail] = useState('supervisor@faena.local');
  const [password, setPassword] = useState('Supervisor_Local_2026_Secure!');
  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/');
    },
  });
  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate();
        }}
      >
        <span className="eyebrow">Panel operativo</span>
        <h1>Ingresa a la faena</h1>
        <p>Monitoreo de sensores y gestión del trabajo en terreno.</p>
        <label>
          Correo
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {login.isError && (
          <p className="error" role="alert">
            {login.error instanceof ApiError
              ? login.error.message
              : 'No fue posible iniciar sesión.'}
          </p>
        )}
        <button className="primary" disabled={login.isPending}>
          {login.isPending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}

function Panel({ user }: { user: UserResponse }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ['me'] });
      navigate('/');
    },
  });
  return (
    <main className="app-shell app-layout">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">PF</span>
          <span>
            <strong>Panel Operativo de Faena</strong>
            <small>Monitoreo y gestión en terreno</small>
          </span>
        </Link>
        <div className="user-menu">
          <span>
            {user.name} · {user.role}
          </span>
          <button onClick={() => logout.mutate()} disabled={logout.isPending}>
            Salir
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar" aria-label="Navegación principal">
          <span className="sidebar-label">Operación</span>
          <Link className={location.pathname === '/' ? 'active' : ''} to="/">
            <span aria-hidden="true">⌂</span> Resumen
          </Link>
          <Link
            className={location.pathname.startsWith('/incidents') ? 'active' : ''}
            to="/incidents"
          >
            <span aria-hidden="true">◈</span> Incidentes
          </Link>
          <Link
            className={location.pathname.startsWith('/work-orders') ? 'active' : ''}
            to="/work-orders"
          >
            <span aria-hidden="true">▦</span> Órdenes de trabajo
          </Link>
        </aside>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/work-orders" element={<WorkOrdersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}

function Dashboard() {
  const incidents = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.incidents(),
    refetchInterval: 15_000,
  });
  const orders = useQuery({
    queryKey: ['work-orders'],
    queryFn: api.workOrders,
    refetchInterval: 15_000,
  });
  const sensors = useQuery({
    queryKey: ['sensors'],
    queryFn: api.sensors,
    refetchInterval: 15_000,
  });
  if (incidents.isPending || orders.isPending || sensors.isPending)
    return <PageMessage title="Cargando resumen" text="Consultando el estado operacional." />;
  if (incidents.isError || orders.isError || sensors.isError)
    return (
      <PageMessage
        title="No se pudo cargar el resumen"
        text="Revisa la conexión y vuelve a intentar."
        error
      />
    );
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Vista operacional</span>
          <h1>Estado de la faena</h1>
        </div>
        <span className="live-dot">● Datos actualizados automáticamente</span>
      </div>
      <div className="metrics">
        <Metric
          label="Incidentes abiertos"
          value={incidents.data.data.filter((item) => item.status !== 'RESOLVED').length}
          tone="danger"
        />
        <Metric
          label="Órdenes activas"
          value={orders.data.data.filter((item) => item.status !== 'CLOSED').length}
          tone="accent"
        />
        <Metric label="Sensores activos" value={sensors.data.length} tone="quiet" />
        <Metric
          label="Tiempo medio de cierre"
          value={averageClosureHours(orders.data.data)}
          tone="quiet"
          suffix=" h"
        />
      </div>
      <div className="two-columns">
        <section className="card">
          <div className="card-heading">
            <h2>Últimos incidentes</h2>
            <Link to="/incidents">Ver todos</Link>
          </div>
          <IncidentList data={incidents.data.data.slice(0, 5)} />
        </section>
        <section className="card">
          <div className="card-heading">
            <h2>Órdenes recientes</h2>
            <Link to="/work-orders">Ver todas</Link>
          </div>
          <OrderList data={orders.data.data.slice(0, 5)} />
        </section>
      </div>
    </section>
  );
}

function averageClosureHours(orders: WorkOrderResponse[]): number {
  const closed = orders.filter((order) => order.closedAt);
  if (!closed.length) return 0;
  const totalHours = closed.reduce((sum, order) => {
    return (
      sum +
      (new Date(order.closedAt as string).getTime() - new Date(order.createdAt).getTime()) /
        3_600_000
    );
  }, 0);
  return Math.round((totalHours / closed.length) * 10) / 10;
}

function IncidentsPage() {
  const client = useQueryClient();
  const incidents = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.incidents(),
    refetchInterval: 15_000,
  });
  const change = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.incidentStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: ['incidents'] }),
  });
  return (
    <section className="content">
      <PageHeading
        eyebrow="Monitoreo"
        title="Incidentes"
        text="Lecturas fuera de rango que requieren seguimiento operativo."
      />
      {incidents.isPending ? (
        <Loading />
      ) : incidents.isError ? (
        <ErrorState error={incidents.error} />
      ) : incidents.data.data.length === 0 ? (
        <Empty text="No hay incidentes para mostrar." />
      ) : (
        <div className="card">
          <IncidentList
            data={incidents.data.data}
            onStatus={(id, status) => change.mutate({ id, status })}
          />
        </div>
      )}
    </section>
  );
}

function IncidentDetailPage() {
  const { id = '' } = useParams();
  const client = useQueryClient();
  const incident = useQuery({
    queryKey: ['incident', id],
    queryFn: () => api.incident(id),
    enabled: Boolean(id),
  });
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.teams });
  const create = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
  const change = useMutation({
    mutationFn: ({ status }: { status: string }) => api.incidentStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: ['incident', id] }),
  });

  if (incident.isPending)
    return <PageMessage title="Cargando incidente" text="Consultando el detalle operacional." />;
  if (incident.isError)
    return (
      <PageMessage title="No se pudo cargar el incidente" text={incident.error.message} error />
    );

  const item = incident.data;
  return (
    <section className="content">
      <Link className="back-link" to="/incidents">
        ← Volver a incidentes
      </Link>
      <div className="page-heading">
        <PageHeading
          eyebrow="Detalle operacional"
          title={`${item.sensorCode} · ${item.areaName}`}
          text="Incidente generado por una lectura fuera de rango."
        />
        <StatusBadge status={item.status} />
      </div>
      <div className="two-columns detail-grid md:grid-cols-2 md:items-start">
        <section className="card detail-card bg-faena-surface">
          <div className="card-heading">
            <h2>Datos del incidente</h2>
            <SeverityBadge severity={item.severity} />
          </div>
          <dl className="detail-list">
            <div>
              <dt>Área</dt>
              <dd>{item.areaName}</dd>
            </div>
            <div>
              <dt>Sensor</dt>
              <dd>{item.sensorCode}</dd>
            </div>
            <div>
              <dt>Detectado</dt>
              <dd>{new Date(item.openedAt).toLocaleString('es-CL')}</dd>
            </div>
            <div>
              <dt>Lectura</dt>
              <dd className="reading-alert">
                {item.value} · rango {item.minValue}–{item.maxValue}
              </dd>
            </div>
          </dl>
          <div className="row-actions">
            {item.status === 'OPEN' && (
              <button
                onClick={() => change.mutate({ status: 'ACKNOWLEDGED' })}
                disabled={change.isPending}
              >
                Tomar incidente
              </button>
            )}
            {item.status === 'ACKNOWLEDGED' && (
              <button
                onClick={() => change.mutate({ status: 'RESOLVED' })}
                disabled={change.isPending}
              >
                Resolver incidente
              </button>
            )}
          </div>
        </section>
        <section className="card detail-card bg-faena-surface">
          <div className="card-heading">
            <h2>Crear orden de trabajo</h2>
            <span className="eyebrow">Gestión</span>
          </div>
          <WorkOrderForm
            incidentId={item.id}
            pending={create.isPending}
            onSubmit={(value) => create.mutate(value)}
          />
          {create.isSuccess && (
            <p className="success" role="status">
              Orden creada correctamente.
            </p>
          )}
          {teams.isError && (
            <p className="error" role="alert">
              No se pudieron cargar los equipos.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function WorkOrdersPage() {
  const client = useQueryClient();
  const orders = useQuery({
    queryKey: ['work-orders'],
    queryFn: api.workOrders,
    refetchInterval: 15_000,
  });
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.teams });
  const [showForm, setShowForm] = useState(false);
  const create = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: async () => {
      setShowForm(false);
      await client.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
  const assign = useMutation({
    mutationFn: ({ id, teamId }: { id: string; teamId: string }) => api.assignWorkOrder(id, teamId),
    onSuccess: () => client.invalidateQueries({ queryKey: ['work-orders'] }),
  });
  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.workOrderStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: ['work-orders'] }),
  });
  return (
    <section className="content">
      <div className="page-heading">
        <PageHeading
          eyebrow="Gestión operacional"
          title="Órdenes de trabajo"
          text="Coordina el trabajo de los equipos en terreno."
        />
        <button className="primary" onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Cancelar' : 'Nueva orden'}
        </button>
      </div>
      {showForm && (
        <WorkOrderForm pending={create.isPending} onSubmit={(value) => create.mutate(value)} />
      )}
      {orders.isPending ? (
        <Loading />
      ) : orders.isError ? (
        <ErrorState error={orders.error} />
      ) : orders.data.data.length === 0 ? (
        <Empty text="Todavía no hay órdenes de trabajo." />
      ) : (
        <OrderBoard
          data={orders.data.data}
          teams={teams.data}
          onAssign={(id, teamId) => assign.mutate({ id, teamId })}
          onAdvance={(id, status) => advance.mutate({ id, status })}
        />
      )}
    </section>
  );
}

function WorkOrderForm({
  incidentId,
  pending,
  onSubmit,
}: {
  incidentId?: string;
  pending: boolean;
  onSubmit: (value: {
    title: string;
    description?: string;
    priority: string;
    incidentId?: string;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  return (
    <form
      className="card form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ title, description: description || undefined, priority, incidentId });
      }}
    >
      <label>
        Título
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={3}
          maxLength={160}
          required
        />
      </label>
      <label>
        Prioridad
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
      </label>
      <label className="full">
        Descripción
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
          rows={3}
        />
      </label>
      <button className="primary" disabled={pending}>
        {pending ? 'Creando…' : 'Crear orden'}
      </button>
    </form>
  );
}

function OrderBoard({
  data,
  teams,
  onAssign,
  onAdvance,
}: {
  data: WorkOrderResponse[];
  teams?: Team[];
  onAssign: (id: string, teamId: string) => void;
  onAdvance: (id: string, status: string) => void;
}) {
  const columns = [
    ['OPEN', 'Abiertas'],
    ['ASSIGNED', 'Asignadas'],
    ['IN_PROGRESS', 'En progreso'],
    ['CLOSED', 'Cerradas'],
  ] as const;
  return (
    <div className="kanban-grid grid grid-cols-1 gap-4 xl:grid-cols-4">
      {columns.map(([status, label]) => (
        <section className="card kanban-column" key={status}>
          <div className="card-heading">
            <h2>{label}</h2>
            <span className="count-badge">
              {data.filter((item) => item.status === status).length}
            </span>
          </div>
          <OrderList
            data={data.filter((item) => item.status === status)}
            teams={teams}
            onAssign={onAssign}
            onAdvance={onAdvance}
          />
        </section>
      ))}
    </div>
  );
}

function IncidentList({
  data,
  onStatus,
}: {
  data: IncidentResponse[];
  onStatus?: (id: string, status: string) => void;
}) {
  return (
    <div className="list">
      {data.map((item) => (
        <article className="list-row" key={item.id}>
          <div>
            <strong>{item.sensorCode}</strong>
            <span>
              {item.areaName} · {item.value} · rango {item.minValue}–{item.maxValue}
            </span>
          </div>
          <div className="row-actions">
            <SeverityBadge severity={item.severity} />
            <StatusBadge status={item.status} />
            {onStatus && item.status === 'OPEN' && (
              <button onClick={() => onStatus(item.id, 'ACKNOWLEDGED')}>Tomar</button>
            )}
            {onStatus && item.status === 'ACKNOWLEDGED' && (
              <button onClick={() => onStatus(item.id, 'RESOLVED')}>Resolver</button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
function OrderList({
  data,
  teams,
  onAssign,
  onAdvance,
}: {
  data: WorkOrderResponse[];
  teams?: Team[];
  onAssign?: (id: string, teamId: string) => void;
  onAdvance?: (id: string, status: string) => void;
}) {
  return (
    <div className="list">
      {data.map((item) => (
        <article className="list-row" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <span>
              {item.priority} · {item.teamName ?? 'Sin equipo'} ·{' '}
              {new Date(item.createdAt).toLocaleString('es-CL')}
            </span>
          </div>
          <div className="row-actions">
            <StatusBadge status={item.status} />
            {item.status === 'OPEN' && teams && onAssign && (
              <select
                aria-label={`Asignar ${item.title}`}
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) onAssign(item.id, event.target.value);
                }}
              >
                <option value="" disabled>
                  Asignar
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            {item.status === 'ASSIGNED' && onAdvance && (
              <button onClick={() => onAdvance(item.id, 'IN_PROGRESS')}>Iniciar</button>
            )}
            {item.status === 'IN_PROGRESS' && onAdvance && (
              <button onClick={() => onAdvance(item.id, 'CLOSED')}>Cerrar</button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>
  );
}
function SeverityBadge({ severity }: { severity: string }) {
  return <span className={`severity severity-${severity.toLowerCase()}`}>{severity}</span>;
}
function Metric({
  label,
  value,
  tone,
  suffix = '',
}: {
  label: string;
  value: number;
  tone: string;
  suffix?: string;
}) {
  return (
    <article className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
    </article>
  );
}
function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {text && <p className="muted">{text}</p>}
    </div>
  );
}
function PageMessage({
  title,
  text,
  error = false,
}: {
  title: string;
  text: string;
  error?: boolean;
}) {
  return (
    <main className="center-page">
      <div className={error ? 'card error-card' : 'card'}>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </main>
  );
}
function Loading() {
  return (
    <div className="card state">
      <span className="spinner" />
      Cargando datos…
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="card state">
      <strong>Sin resultados</strong>
      <span>{text}</span>
    </div>
  );
}
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="card state error-card">
      <strong>No se pudieron cargar los datos</strong>
      <span>
        {error instanceof ApiError && error.requestId
          ? `${error.message} (${error.requestId})`
          : error.message}
      </span>
    </div>
  );
}

export default App;
