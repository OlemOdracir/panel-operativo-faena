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
import { useMemo, useState } from 'react';
import { LayoutDashboard, ListTodo, Radio, RefreshCw, TriangleAlert } from 'lucide-react';
import {
  esCL,
  formatDateTime,
  labelRole,
  labelSeverity,
  labelStatus,
  type IncidentResponse,
  type UserResponse,
  type WorkOrderResponse,
} from '@faena/contracts';
import { ApiError, api, type Team } from './api';
import { authQueryKeys } from './features/auth/query-keys';
import { catalogQueryKeys } from './features/catalog/query-keys';
import { incidentQueryKeys } from './features/incidents/query-keys';
import { workOrderQueryKeys } from './features/work-orders/query-keys';

const emptyIncidents: IncidentResponse[] = [];
const emptyWorkOrders: WorkOrderResponse[] = [];

function App() {
  const me = useQuery({ queryKey: authQueryKeys.me, queryFn: api.me, retry: false });
  if (me.isPending)
    return <PageMessage title={esCL.auth.loadingTitle} text={esCL.auth.loadingText} />;
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
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
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
        <span className="eyebrow">{esCL.app.operationalPanel}</span>
        <h1>{esCL.auth.loginTitle}</h1>
        <p>{esCL.auth.loginDescription}</p>
        <label>
          {esCL.auth.email}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          {esCL.auth.password}
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
            {login.error instanceof ApiError ? login.error.message : esCL.auth.loginFailed}
          </p>
        )}
        <button className="primary" disabled={login.isPending}>
          {login.isPending ? esCL.auth.loggingIn : esCL.auth.login}
        </button>
      </form>
    </main>
  );
}

function Panel({ user }: { user: UserResponse }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const incidentSummary = useQuery({
    queryKey: incidentQueryKeys.all,
    queryFn: () => api.incidents(),
    refetchInterval: 15_000,
  });
  const openIncidentCount =
    incidentSummary.data?.data.filter((incident) => incident.status !== 'RESOLVED').length ?? 0;
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: authQueryKeys.me });
      navigate('/');
    },
  });
  return (
    <main className="app-shell app-layout">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">PF</span>
          <span>
            <strong>{esCL.app.name}</strong>
            <small>{esCL.app.subtitle}</small>
          </span>
        </Link>
        <div className="user-menu">
          <span>
            {user.name} · {labelRole(user.role)}
          </span>
          <button onClick={() => logout.mutate()} disabled={logout.isPending}>
            {esCL.auth.logout}
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar" aria-label={esCL.navigation.label}>
          <span className="sidebar-label">{esCL.navigation.operation}</span>
          <Link className={location.pathname === '/' ? 'active' : ''} to="/">
            <LayoutDashboard aria-hidden="true" className="nav-icon" size={18} strokeWidth={1.75} />
            {esCL.navigation.dashboard}
          </Link>
          <Link
            className={location.pathname.startsWith('/incidents') ? 'active' : ''}
            to="/incidents"
          >
            <TriangleAlert aria-hidden="true" className="nav-icon" size={18} strokeWidth={1.75} />
            <span>{esCL.navigation.incidents}</span>
            {openIncidentCount > 0 && <span className="nav-count">{openIncidentCount}</span>}
          </Link>
          <Link
            className={location.pathname.startsWith('/work-orders') ? 'active' : ''}
            to="/work-orders"
          >
            <ListTodo aria-hidden="true" className="nav-icon" size={18} strokeWidth={1.75} />
            {esCL.navigation.workOrders}
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
    queryKey: incidentQueryKeys.all,
    queryFn: () => api.incidents(),
    refetchInterval: 15_000,
  });
  const orders = useQuery({
    queryKey: workOrderQueryKeys.all,
    queryFn: api.workOrders,
    refetchInterval: 15_000,
  });
  const sensors = useQuery({
    queryKey: catalogQueryKeys.sensors,
    queryFn: api.sensors,
    refetchInterval: 15_000,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    severity: '',
    area: '',
    sensor: '',
  });
  const allIncidents = incidents.data?.data ?? emptyIncidents;
  const allOrders = orders.data?.data ?? emptyWorkOrders;
  const areas = [...new Set(allIncidents.map((incident) => incident.areaName))].sort();
  const sensorCodes = [...new Set(allIncidents.map((incident) => incident.sensorCode))].sort();
  const filteredIncidents = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase(esCL.locale);
    return allIncidents.filter((incident) => {
      const matchesSearch =
        !search ||
        `${incidentReference(incident.id)} ${incident.sensorCode} ${incident.areaName}`
          .toLocaleLowerCase(esCL.locale)
          .includes(search);
      return (
        matchesSearch &&
        (!filters.status || incident.status === filters.status) &&
        (!filters.severity || incident.severity === filters.severity) &&
        (!filters.area || incident.areaName === filters.area) &&
        (!filters.sensor || incident.sensorCode === filters.sensor)
      );
    });
  }, [allIncidents, filters]);
  const inProgressOrders = allOrders.filter((order) => order.status === 'IN_PROGRESS').length;
  const latestUpdate = Math.max(
    incidents.dataUpdatedAt,
    orders.dataUpdatedAt,
    sensors.dataUpdatedAt,
  );
  const isRefreshing = incidents.isFetching || orders.isFetching || sensors.isFetching;
  const refresh = () => {
    void Promise.all([incidents.refetch(), orders.refetch(), sensors.refetch()]);
  };
  if (incidents.isPending || orders.isPending || sensors.isPending)
    return <PageMessage title={esCL.dashboard.loadingTitle} text={esCL.dashboard.loadingText} />;
  if (incidents.isError || orders.isError || sensors.isError)
    return <PageMessage title={esCL.dashboard.errorTitle} text={esCL.dashboard.errorText} error />;
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{esCL.dashboard.eyebrow}</span>
          <h1>{esCL.dashboard.title}</h1>
        </div>
        <div className="dashboard-actions">
          <span className="live-dot">
            <Radio aria-hidden="true" size={16} strokeWidth={1.75} />
            {esCL.dashboard.live}
          </span>
          <span className="updated-at">
            {esCL.dashboard.updatedAt}: {formatDateTime(new Date(latestUpdate).toISOString())}
          </span>
          <button className="refresh-button" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw aria-hidden="true" size={15} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? esCL.dashboard.refreshing : esCL.dashboard.refresh}
          </button>
        </div>
      </div>
      <div className="metrics">
        <Metric
          label={esCL.dashboard.openIncidents}
          value={allIncidents.filter((item) => item.status !== 'RESOLVED').length}
          tone="danger"
        />
        <Metric
          label={esCL.dashboard.activeWorkOrders}
          value={allOrders.filter((item) => item.status !== 'CLOSED').length}
          tone="accent"
          hint={esCL.dashboard.inProgressHint(inProgressOrders)}
        />
        <Metric label={esCL.dashboard.activeSensors} value={sensors.data.length} tone="quiet" />
        <Metric
          label={esCL.dashboard.averageClosureTime}
          value={averageClosureHours(allOrders)}
          tone="quiet"
          suffix=" h"
        />
      </div>
      <section className="card dashboard-filter-card" aria-label={esCL.dashboard.filters}>
        <div className="card-heading">
          <div>
            <h2>{esCL.dashboard.filters}</h2>
            <p>{esCL.dashboard.showing(filteredIncidents.length, allIncidents.length)}</p>
          </div>
          <button
            onClick={() =>
              setFilters({ search: '', status: '', severity: '', area: '', sensor: '' })
            }
            disabled={Object.values(filters).every((value) => !value)}
          >
            {esCL.dashboard.clearFilters}
          </button>
        </div>
        <div className="dashboard-filters">
          <label>
            {esCL.dashboard.search}
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder={esCL.dashboard.searchPlaceholder}
            />
          </label>
          <DashboardSelect
            label={esCL.dashboard.status}
            value={filters.status}
            onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            emptyLabel={esCL.dashboard.allStatuses}
            options={[
              ['OPEN', labelStatus('OPEN')],
              ['ACKNOWLEDGED', labelStatus('ACKNOWLEDGED')],
              ['RESOLVED', labelStatus('RESOLVED')],
            ]}
          />
          <DashboardSelect
            label={esCL.dashboard.severity}
            value={filters.severity}
            onChange={(value) => setFilters((current) => ({ ...current, severity: value }))}
            emptyLabel={esCL.dashboard.allSeverities}
            options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => [
              severity,
              labelSeverity(severity),
            ])}
          />
          <DashboardSelect
            label={esCL.dashboard.area}
            value={filters.area}
            onChange={(value) => setFilters((current) => ({ ...current, area: value }))}
            emptyLabel={esCL.dashboard.allAreas}
            options={areas.map((area) => [area, area])}
          />
          <DashboardSelect
            label={esCL.dashboard.sensor}
            value={filters.sensor}
            onChange={(value) => setFilters((current) => ({ ...current, sensor: value }))}
            emptyLabel={esCL.dashboard.allSensors}
            options={sensorCodes.map((sensor) => [sensor, sensor])}
          />
        </div>
      </section>
      <div className="dashboard-primary-grid">
        <section className="card dashboard-table-card">
          <div className="card-heading">
            <div>
              <h2>{esCL.dashboard.incidentsToManage}</h2>
              <p>{esCL.dashboard.incidentTableDescription}</p>
            </div>
            <Link to="/incidents">{esCL.dashboard.seeAll}</Link>
          </div>
          <IncidentTable data={filteredIncidents} />
        </section>
        <aside className="dashboard-summary-stack">
          <OperationalDistribution
            title={esCL.dashboard.severityDistribution}
            entries={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => ({
              label: labelSeverity(severity),
              value: allIncidents.filter((incident) => incident.severity === severity).length,
              tone: severity.toLowerCase(),
            }))}
          />
          <OperationalDistribution
            title={esCL.dashboard.workOrderSummary}
            entries={['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED'].map((status) => ({
              label: labelStatus(status),
              value: allOrders.filter((order) => order.status === status).length,
              tone: status.toLowerCase(),
            }))}
          />
        </aside>
      </div>
      <section className="card dashboard-orders-card">
        <div className="card-heading">
          <h2>{esCL.dashboard.recentWorkOrders}</h2>
          <Link to="/work-orders">{esCL.dashboard.seeAllFeminine}</Link>
        </div>
        <OrderList data={allOrders.slice(0, 5)} />
      </section>
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
    queryKey: incidentQueryKeys.all,
    queryFn: () => api.incidents(),
    refetchInterval: 15_000,
  });
  const change = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.incidentStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: incidentQueryKeys.all }),
  });
  return (
    <section className="content">
      <PageHeading
        eyebrow={esCL.incidents.eyebrow}
        title={esCL.incidents.title}
        text={esCL.incidents.description}
      />
      {incidents.isPending ? (
        <Loading />
      ) : incidents.isError ? (
        <ErrorState error={incidents.error} />
      ) : incidents.data.data.length === 0 ? (
        <Empty text={esCL.incidents.empty} />
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
    queryKey: incidentQueryKeys.detail(id),
    queryFn: () => api.incident(id),
    enabled: Boolean(id),
  });
  const teams = useQuery({ queryKey: catalogQueryKeys.teams, queryFn: api.teams });
  const create = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const change = useMutation({
    mutationFn: ({ status }: { status: string }) => api.incidentStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: incidentQueryKeys.detail(id) }),
  });

  if (incident.isPending)
    return <PageMessage title={esCL.incidents.loadingTitle} text={esCL.incidents.loadingText} />;
  if (incident.isError)
    return <PageMessage title={esCL.incidents.errorTitle} text={incident.error.message} error />;

  const item = incident.data;
  return (
    <section className="content">
      <Link className="back-link" to="/incidents">
        {esCL.incidents.back}
      </Link>
      <div className="page-heading">
        <PageHeading
          eyebrow={esCL.incidents.detailEyebrow}
          title={`${item.sensorCode} · ${item.areaName}`}
          text={esCL.incidents.detailDescription}
        />
        <StatusBadge status={item.status} />
      </div>
      <div className="two-columns detail-grid md:grid-cols-2 md:items-start">
        <section className="card detail-card bg-faena-surface">
          <div className="card-heading">
            <h2>{esCL.incidents.detailTitle}</h2>
            <SeverityBadge severity={item.severity} />
          </div>
          <dl className="detail-list">
            <div>
              <dt>{esCL.incidents.area}</dt>
              <dd>{item.areaName}</dd>
            </div>
            <div>
              <dt>{esCL.incidents.sensor}</dt>
              <dd>{item.sensorCode}</dd>
            </div>
            <div>
              <dt>{esCL.incidents.detected}</dt>
              <dd>{formatDateTime(item.openedAt)}</dd>
            </div>
            <div>
              <dt>{esCL.incidents.reading}</dt>
              <dd className="reading-alert">
                {item.value} · {esCL.incidents.range} {item.minValue}–{item.maxValue}
              </dd>
            </div>
          </dl>
          <div className="row-actions">
            {item.status === 'OPEN' && (
              <button
                onClick={() => change.mutate({ status: 'ACKNOWLEDGED' })}
                disabled={change.isPending}
              >
                {esCL.incidents.takeIncident}
              </button>
            )}
            {item.status === 'ACKNOWLEDGED' && (
              <button
                onClick={() => change.mutate({ status: 'RESOLVED' })}
                disabled={change.isPending}
              >
                {esCL.incidents.resolveIncident}
              </button>
            )}
          </div>
        </section>
        <section className="card detail-card bg-faena-surface">
          <div className="card-heading">
            <h2>{esCL.workOrders.createTitle}</h2>
            <span className="eyebrow">{esCL.workOrders.management}</span>
          </div>
          <WorkOrderForm
            incidentId={item.id}
            pending={create.isPending}
            onSubmit={(value) => create.mutate(value)}
          />
          {create.isSuccess && (
            <p className="success" role="status">
              {esCL.workOrders.created}
            </p>
          )}
          {teams.isError && (
            <p className="error" role="alert">
              {esCL.workOrders.teamsLoadFailed}
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
    queryKey: workOrderQueryKeys.all,
    queryFn: api.workOrders,
    refetchInterval: 15_000,
  });
  const teams = useQuery({ queryKey: catalogQueryKeys.teams, queryFn: api.teams });
  const [showForm, setShowForm] = useState(false);
  const create = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: async () => {
      setShowForm(false);
      await client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const assign = useMutation({
    mutationFn: ({ id, teamId }: { id: string; teamId: string }) => api.assignWorkOrder(id, teamId),
    onSuccess: () => client.invalidateQueries({ queryKey: workOrderQueryKeys.all }),
  });
  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.workOrderStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: workOrderQueryKeys.all }),
  });
  return (
    <section className="content">
      <div className="page-heading">
        <PageHeading
          eyebrow={esCL.workOrders.eyebrow}
          title={esCL.workOrders.title}
          text={esCL.workOrders.description}
        />
        <button className="primary" onClick={() => setShowForm((value) => !value)}>
          {showForm ? esCL.workOrders.cancel : esCL.workOrders.new}
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
        <Empty text={esCL.workOrders.empty} />
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
        {esCL.workOrders.titleLabel}
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={3}
          maxLength={160}
          required
        />
      </label>
      <label>
        {esCL.workOrders.priority}
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="LOW">{labelSeverity('LOW')}</option>
          <option value="MEDIUM">{labelSeverity('MEDIUM')}</option>
          <option value="HIGH">{labelSeverity('HIGH')}</option>
          <option value="CRITICAL">{labelSeverity('CRITICAL')}</option>
        </select>
      </label>
      <label className="full">
        {esCL.workOrders.descriptionLabel}
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
          rows={3}
        />
      </label>
      <button className="primary" disabled={pending}>
        {pending ? esCL.workOrders.creating : esCL.workOrders.create}
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
    ['OPEN', esCL.workOrderColumn.OPEN],
    ['ASSIGNED', esCL.workOrderColumn.ASSIGNED],
    ['IN_PROGRESS', esCL.workOrderColumn.IN_PROGRESS],
    ['CLOSED', esCL.workOrderColumn.CLOSED],
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

function DashboardSelect({
  label,
  value,
  onChange,
  emptyLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  emptyLabel: string;
  options: Array<[string, string]>;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{emptyLabel}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function IncidentTable({ data }: { data: IncidentResponse[] }) {
  if (!data.length) return <p className="dashboard-empty">{esCL.dashboard.noMatchingIncidents}</p>;
  return (
    <div className="incident-table-wrap">
      <table className="incident-table">
        <thead>
          <tr>
            <th>{esCL.dashboard.incident}</th>
            <th>{esCL.dashboard.sensor}</th>
            <th>{esCL.dashboard.area}</th>
            <th>{esCL.dashboard.readingRange}</th>
            <th>{esCL.dashboard.severity}</th>
            <th>{esCL.dashboard.status}</th>
            <th>{esCL.dashboard.age}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((incident) => (
            <tr key={incident.id}>
              <td>
                <Link className="incident-reference" to={`/incidents/${incident.id}`}>
                  {incidentReference(incident.id)}
                </Link>
              </td>
              <td>
                <strong>{incident.sensorCode}</strong>
              </td>
              <td>{incident.areaName}</td>
              <td className="reading-cell">
                <strong>{incident.value}</strong>
                <span>
                  {incident.minValue}–{incident.maxValue}
                </span>
              </td>
              <td>
                <SeverityBadge severity={incident.severity} />
              </td>
              <td>
                <StatusBadge status={incident.status} />
              </td>
              <td>
                <time dateTime={incident.openedAt} title={formatDateTime(incident.openedAt)}>
                  {incidentAge(incident.openedAt)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OperationalDistribution({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ label: string; value: number; tone: string }>;
}) {
  const largestValue = Math.max(...entries.map((entry) => entry.value), 1);
  return (
    <section className="card distribution-card">
      <h2>{title}</h2>
      <ul className="distribution-list">
        {entries.map((entry) => (
          <li key={entry.tone}>
            <span>{entry.label}</span>
            <span className="distribution-track" aria-hidden="true">
              <span
                className={`distribution-bar distribution-${entry.tone}`}
                style={{ width: `${(entry.value / largestValue) * 100}%` }}
              />
            </span>
            <strong>{entry.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function incidentReference(id: string): string {
  return `INC-${id.slice(0, 8).toUpperCase()}`;
}

function incidentAge(openedAt: string): string {
  const elapsedHours = Math.max(
    0,
    Math.floor((Date.now() - new Date(openedAt).getTime()) / 3_600_000),
  );
  return elapsedHours < 1 ? esCL.dashboard.lessThanOneHour : esCL.dashboard.hoursOpen(elapsedHours);
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
              {item.areaName} · {item.value} · {esCL.incidents.range} {item.minValue}–
              {item.maxValue}
            </span>
          </div>
          <div className="row-actions">
            <SeverityBadge severity={item.severity} />
            <StatusBadge status={item.status} />
            {onStatus && item.status === 'OPEN' && (
              <button onClick={() => onStatus(item.id, 'ACKNOWLEDGED')}>
                {esCL.incidents.take}
              </button>
            )}
            {onStatus && item.status === 'ACKNOWLEDGED' && (
              <button onClick={() => onStatus(item.id, 'RESOLVED')}>
                {esCL.incidents.resolve}
              </button>
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
              {labelSeverity(item.priority)} · {item.teamName ?? esCL.workOrders.noTeam} ·{' '}
              {formatDateTime(item.createdAt)}
            </span>
          </div>
          <div className="row-actions">
            <StatusBadge status={item.status} />
            {item.status === 'OPEN' && teams && onAssign && (
              <select
                aria-label={esCL.workOrders.assignAria(item.title)}
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) onAssign(item.id, event.target.value);
                }}
              >
                <option value="" disabled>
                  {esCL.workOrders.assign}
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            {item.status === 'ASSIGNED' && onAdvance && (
              <button onClick={() => onAdvance(item.id, 'IN_PROGRESS')}>
                {esCL.workOrders.start}
              </button>
            )}
            {item.status === 'IN_PROGRESS' && onAdvance && (
              <button onClick={() => onAdvance(item.id, 'CLOSED')}>{esCL.workOrders.close}</button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labelStatus(status)}</span>;
}
function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`severity severity-${severity.toLowerCase()}`}>{labelSeverity(severity)}</span>
  );
}
function Metric({
  label,
  value,
  tone,
  suffix = '',
  hint,
}: {
  label: string;
  value: number;
  tone: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <article className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
      {hint && <small>{hint}</small>}
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
      {esCL.state.loading}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="card state">
      <strong>{esCL.state.noResults}</strong>
      <span>{text}</span>
    </div>
  );
}
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="card state error-card">
      <strong>{esCL.state.dataLoadFailed}</strong>
      <span>
        {error instanceof ApiError && error.requestId
          ? `${error.message} (${error.requestId})`
          : error.message}
      </span>
    </div>
  );
}

export default App;
