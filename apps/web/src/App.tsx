import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { DatePicker as _DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table';
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  IncidentListQuery,
  IncidentResponse,
  IncidentSeverity,
  IncidentStatus,
  Priority,
  UserResponse,
  WorkOrderListQuery,
  WorkOrderResponse,
  WorkOrderStatus,
} from '@faena/contracts';
import { esCL, labelRole, labelSeverity, labelStatus, formatDateTime } from '@faena/contracts';
import { api, ApiError, type Team } from './api';
import { authQueryKeys } from './features/auth/query-keys';
import { catalogQueryKeys } from './features/catalog/query-keys';
import { incidentQueryKeys } from './features/incidents/query-keys';
import { workOrderQueryKeys } from './features/work-orders/query-keys';

const drawerWidth = 264;
const collapsedDrawerWidth = 72;

function App() {
  const me = useQuery({ queryKey: authQueryKeys.me, queryFn: api.me, retry: false });
  if (me.isPending)
    return <PageState title={esCL.auth.loadingTitle} text={esCL.auth.loadingText} />;
  if (me.isError || !me.data) return <LoginPage />;
  return <Panel user={me.data} />;
}

function LoginPage() {
  const client = useQueryClient();
  const [email, setEmail] = useState('supervisor@faena.local');
  const [password, setPassword] = useState('');
  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (user) => client.setQueryData(authQueryKeys.me, user),
  });
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Card sx={{ width: 'min(100%, 440px)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack
            spacing={3}
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              login.mutate();
            }}
          >
            <Box>
              <Typography variant="overline" color="primary">
                {esCL.app.operationalPanel}
              </Typography>
              <Typography variant="h4" component="h1" sx={{ mt: 1 }}>
                {esCL.auth.loginTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {esCL.auth.loginDescription}
              </Typography>
            </Box>
            <TextField
              label={esCL.auth.email}
              inputProps={{ 'aria-label': esCL.auth.email }}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              label={esCL.auth.password}
              inputProps={{ 'aria-label': esCL.auth.password }}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {login.isError && <Alert severity="error">{esCL.auth.loginFailed}</Alert>}
            <Button type="submit" variant="contained" disabled={login.isPending}>
              {login.isPending ? esCL.auth.loggingIn : esCL.auth.login}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function Panel({ user }: { user: UserResponse }) {
  const client = useQueryClient();
  const location = useLocation();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const openIncidents = useQuery({
    queryKey: [...incidentQueryKeys.all, { status: 'OPEN', pageSize: 100 }],
    queryFn: () => api.incidents({ status: 'OPEN', pageSize: 100 }),
  });
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => client.removeQueries({ queryKey: authQueryKeys.me }),
  });
  const expanded = mobile ? true : !collapsed;
  const nav = [
    {
      to: '/',
      label: esCL.navigation.dashboard,
      icon: <DashboardIcon />,
      active: location.pathname === '/',
    },
    {
      to: '/incidents',
      label: esCL.navigation.incidents,
      icon: <WarningAmberIcon />,
      active: location.pathname.startsWith('/incidents'),
      count: openIncidents.data?.meta.total,
    },
    {
      to: '/work-orders',
      label: esCL.navigation.workOrders,
      icon: <WorkOutlineIcon />,
      active: location.pathname.startsWith('/work-orders'),
    },
  ];
  const drawer = (
    <Box
      component="nav"
      aria-label={esCL.navigation.label}
      sx={{ width: expanded ? drawerWidth : collapsedDrawerWidth }}
    >
      <Toolbar
        sx={{ minHeight: '72px !important', justifyContent: expanded ? 'flex-end' : 'center' }}
      >
        <Tooltip title={expanded ? 'Colapsar menú' : 'Expandir menú'}>
          <IconButton
            onClick={() => (mobile ? setMobileOpen(false) : setCollapsed((value) => !value))}
            aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}
          >
            {mobile || expanded ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>
          {esCL.navigation.operation}
        </Typography>
        {nav.map((item) => (
          <Tooltip key={item.to} title={expanded ? '' : item.label} placement="right">
            <ListItemButton
              component={RouterLink}
              to={item.to}
              selected={item.active}
              onClick={() => setMobileOpen(false)}
              sx={{
                my: 0.5,
                minHeight: 48,
                borderRadius: 2,
                justifyContent: expanded ? 'initial' : 'center',
                px: 1.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: expanded ? 40 : 0,
                  justifyContent: 'center',
                  color: item.active ? 'primary.main' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {expanded && <ListItemText primary={item.label} />}
              {expanded && item.count ? (
                <Chip size="small" label={item.count} color="error" />
              ) : null}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, md: 4 }, gap: 2 }}>
          {mobile && (
            <IconButton onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
              <MenuIcon />
            </IconButton>
          )}
          <Box
            sx={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 2,
              fontWeight: 800,
            }}
          >
            PF
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={700}>{esCL.app.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {esCL.app.subtitle}
            </Typography>
          </Box>
          <Typography sx={{ display: { xs: 'none', sm: 'block' } }} color="text.secondary">
            {user.name} · {labelRole(user.role)}
          </Typography>
          <Button color="inherit" onClick={() => logout.mutate()}>
            {esCL.auth.logout}
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={mobile ? 'temporary' : 'permanent'}
        open={mobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: mobile ? drawerWidth : expanded ? drawerWidth : collapsedDrawerWidth,
            transition: 'width 160ms ease',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          ml: mobile ? 0 : `${expanded ? drawerWidth : collapsedDrawerWidth}px`,
          transition: 'margin-left 160ms ease',
          pt: '72px',
        }}
      >
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: 1800, width: '100%', mx: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/work-orders" element={<WorkOrdersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
        <Box
          component="footer"
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            px: { xs: 2, md: 4 },
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            color: 'text.secondary',
          }}
        >
          <Stack direction="row" spacing={1} divider={<span>·</span>}>
            <Typography variant="body2">
              {esCL.footer.copyright(new Date().getFullYear())}
            </Typography>
            <Typography variant="body2">{esCL.footer.internalUse}</Typography>
          </Stack>
          <Typography variant="body2" color="success.main">
            {esCL.footer.protectedSession}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function Dashboard() {
  const incidents = useQuery({
    queryKey: [...incidentQueryKeys.all, 'dashboard'],
    queryFn: () => api.incidents({ pageSize: 100 }),
  });
  const orders = useQuery({
    queryKey: [...workOrderQueryKeys.all, 'dashboard'],
    queryFn: () => api.workOrders({ pageSize: 100 }),
  });
  const sensors = useQuery({ queryKey: catalogQueryKeys.sensors, queryFn: api.sensors });
  if (incidents.isPending || orders.isPending || sensors.isPending)
    return <PageState title={esCL.dashboard.loadingTitle} text={esCL.dashboard.loadingText} />;
  if (incidents.isError || orders.isError || sensors.isError)
    return <ErrorState error={incidents.error ?? orders.error ?? sensors.error} />;
  const incidentData = incidents.data.data;
  const orderData = orders.data.data;
  const openIncidents = incidentData.filter((item) => item.status !== 'RESOLVED');
  const activeOrders = orderData.filter((item) => item.status !== 'CLOSED');
  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow={esCL.dashboard.eyebrow}
        title={esCL.dashboard.title}
        text={esCL.dashboard.live}
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              void incidents.refetch();
              void orders.refetch();
              void sensors.refetch();
            }}
          >
            {esCL.dashboard.refresh}
          </Button>
        }
      />
      <Grid container spacing={2}>
        <Metric label={esCL.dashboard.openIncidents} value={openIncidents.length} tone="error" />
        <Metric
          label={esCL.dashboard.activeWorkOrders}
          value={activeOrders.length}
          tone="primary"
          hint={esCL.dashboard.inProgressHint(
            activeOrders.filter((item) => item.status === 'IN_PROGRESS').length,
          )}
        />
        <Metric label={esCL.dashboard.activeSensors} value={sensors.data.length} />
        <Metric
          label={esCL.dashboard.averageClosureTime}
          value={`${averageClosureHours(orderData)} h`}
        />
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <PriorityList data={openIncidents.slice(0, 6)} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Distribution data={incidentData} />
        </Grid>
      </Grid>
      <Card>
        <CardContent>
          <SectionHeading
            title={esCL.dashboard.recentWorkOrders}
            action={
              <Button component={RouterLink} to="/work-orders">
                {esCL.dashboard.seeAll}
              </Button>
            }
          />
          <OrderPreview data={orderData.slice(0, 5)} />
        </CardContent>
      </Card>
    </Stack>
  );
}

function IncidentsPage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: Number(params.get('page') ?? 1) - 1,
    pageSize: Number(params.get('pageSize') ?? 20),
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState<IncidentStatus | ''>(
    (params.get('status') as IncidentStatus | null) ?? '',
  );
  const [severity, setSeverity] = useState<IncidentSeverity | ''>(
    (params.get('severity') as IncidentSeverity | null) ?? '',
  );
  const [areaId, setAreaId] = useState(params.get('areaId') ?? '');
  const [sensorId, setSensorId] = useState(params.get('sensorId') ?? '');
  const [openedFrom, setOpenedFrom] = useState<Dayjs | null>(null);
  const [openedTo, setOpenedTo] = useState<Dayjs | null>(null);
  const debouncedQ = useDebouncedValue(q, 300);
  const areas = useQuery({ queryKey: catalogQueryKeys.areas, queryFn: api.areas });
  const sensors = useQuery({ queryKey: catalogQueryKeys.sensors, queryFn: api.sensors });
  const query = useMemo<Partial<IncidentListQuery>>(() => {
    const tableFilter = (id: string) => columnFilters.find((filter) => filter.id === id)?.value;
    const tableSearch = tableFilter('sensorCode') ?? tableFilter('areaName');
    const tableStatus = tableFilter('status');
    const tableSeverity = tableFilter('severity');
    return {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      q: debouncedQ || (typeof tableSearch === 'string' ? tableSearch : undefined),
      status:
        status ||
        (tableStatus === 'OPEN' || tableStatus === 'ACKNOWLEDGED' || tableStatus === 'RESOLVED'
          ? tableStatus
          : undefined),
      severity:
        severity ||
        (tableSeverity === 'LOW' ||
        tableSeverity === 'MEDIUM' ||
        tableSeverity === 'HIGH' ||
        tableSeverity === 'CRITICAL'
          ? tableSeverity
          : undefined),
      areaId: areaId || undefined,
      sensorId: sensorId || undefined,
      openedFrom: openedFrom?.toISOString(),
      openedTo: openedTo?.toISOString(),
      sortBy: (sorting[0]?.id as IncidentListQuery['sortBy']) || 'openedAt',
      sortDirection: sorting[0]?.desc ? 'desc' : 'asc',
    };
  }, [
    pagination,
    debouncedQ,
    status,
    severity,
    areaId,
    sensorId,
    openedFrom,
    openedTo,
    sorting,
    columnFilters,
  ]);
  useEffect(() => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== '')
        next.set(key, Array.isArray(value) ? value.join(',') : String(value));
    setParams(next, { replace: true });
  }, [query, setParams]);
  const incidents = useQuery({
    queryKey: [...incidentQueryKeys.all, query],
    queryFn: () => api.incidents(query),
  });
  const change = useMutation({
    mutationFn: ({ id, next }: { id: string; next: IncidentStatus }) =>
      api.incidentStatus(id, next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: incidentQueryKeys.all });
    },
  });
  const table = useIncidentTable(
    incidents.data?.data ?? [],
    incidents.data?.meta.total ?? 0,
    incidents.data?.meta.totalPages ?? 0,
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    (id) => change.mutate({ id, next: 'ACKNOWLEDGED' }),
    (id) => change.mutate({ id, next: 'RESOLVED' }),
  );
  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow={esCL.incidents.eyebrow}
        title={esCL.incidents.title}
        text={esCL.incidents.description}
      />
      <FilterCard
        title={esCL.incidents.filters}
        onClear={() => {
          setQ('');
          setStatus('');
          setSeverity('');
          setAreaId('');
          setSensorId('');
          setOpenedFrom(null);
          setOpenedTo(null);
          setColumnFilters([]);
        }}
      >
        <TextField
          label={esCL.incidents.search}
          placeholder={esCL.incidents.searchPlaceholder}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />
        <SelectField
          label={esCL.incidents.status}
          value={status}
          onChange={(value) => setStatus(value as IncidentStatus | '')}
          options={[
            ['', esCL.incidents.allStatuses],
            ['OPEN', labelStatus('OPEN')],
            ['ACKNOWLEDGED', labelStatus('ACKNOWLEDGED')],
            ['RESOLVED', labelStatus('RESOLVED')],
          ]}
        />
        <SelectField
          label={esCL.incidents.severity}
          value={severity}
          onChange={(value) => setSeverity(value as IncidentSeverity | '')}
          options={[
            ['', esCL.incidents.allSeverities],
            ['LOW', labelSeverity('LOW')],
            ['MEDIUM', labelSeverity('MEDIUM')],
            ['HIGH', labelSeverity('HIGH')],
            ['CRITICAL', labelSeverity('CRITICAL')],
          ]}
        />
        <SelectField
          label={esCL.incidents.area}
          value={areaId}
          onChange={setAreaId}
          options={[
            ['', esCL.incidents.allAreas],
            ...(areas.data ?? []).map((area) => [area.id, area.name] as [string, string]),
          ]}
        />
        <SelectField
          label={esCL.incidents.sensor}
          value={sensorId}
          onChange={setSensorId}
          options={[
            ['', esCL.incidents.allSensors],
            ...(sensors.data ?? []).map((sensor) => [sensor.id, sensor.code] as [string, string]),
          ]}
        />
        <_DatePicker
          label="Desde"
          value={openedFrom}
          onChange={setOpenedFrom}
          slotProps={{ textField: { size: 'small' } }}
        />
        <_DatePicker
          label="Hasta"
          value={openedTo}
          onChange={setOpenedTo}
          slotProps={{ textField: { size: 'small' } }}
        />
      </FilterCard>
      {incidents.isError ? (
        <ErrorState error={incidents.error} />
      ) : incidents.isPending ? (
        <Loading />
      ) : incidents.data.data.length === 0 ? (
        <Empty
          text={
            q || status || severity || areaId || sensorId
              ? esCL.incidents.noMatching
              : esCL.incidents.empty
          }
        />
      ) : (
        <MaterialReactTable table={table} />
      )}
    </Stack>
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
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const change = useMutation({
    mutationFn: ({ next }: { next: IncidentStatus }) => api.incidentStatus(id, next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: incidentQueryKeys.detail(id) });
      void client.invalidateQueries({ queryKey: incidentQueryKeys.all });
    },
  });
  if (incident.isPending) return <Loading />;
  if (incident.isError) return <ErrorState error={incident.error} />;
  const item = incident.data;
  return (
    <Stack spacing={3}>
      <Button component={RouterLink} to="/incidents" sx={{ alignSelf: 'flex-start' }}>
        ← {esCL.incidents.title}
      </Button>
      <PageHeading
        eyebrow={esCL.incidents.detailEyebrow}
        title={item.sensorCode}
        text={esCL.incidents.detailDescription}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <SectionHeading title={esCL.incidents.detailTitle} />
              <DetailRow label={esCL.incidents.area} value={item.areaName} />
              <DetailRow label={esCL.incidents.sensor} value={item.sensorCode} />
              <DetailRow label={esCL.incidents.reading} value={String(item.value)} />
              <DetailRow
                label={esCL.incidents.range}
                value={`${item.minValue} – ${item.maxValue}`}
              />
              <DetailRow label={esCL.incidents.detected} value={formatDateTime(item.openedAt)} />
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <StatusChip status={item.status} />
                <SeverityChip severity={item.severity} />
                {item.status === 'OPEN' && (
                  <Button
                    variant="contained"
                    onClick={() => change.mutate({ next: 'ACKNOWLEDGED' })}
                  >
                    {esCL.incidents.takeIncident}
                  </Button>
                )}
                {item.status === 'ACKNOWLEDGED' && (
                  <Button variant="contained" onClick={() => change.mutate({ next: 'RESOLVED' })}>
                    {esCL.incidents.resolveIncident}
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <WorkOrderForm
            incidentId={item.id}
            teams={teams.data ?? []}
            pending={create.isPending}
            onSubmit={(body) => create.mutate(body)}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

function WorkOrdersPage() {
  const client = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<WorkOrderStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [teamId, setTeamId] = useState('');
  const [createdFrom, setCreatedFrom] = useState<Dayjs | null>(null);
  const [createdTo, setCreatedTo] = useState<Dayjs | null>(null);
  const debouncedQ = useDebouncedValue(q, 300);
  const teams = useQuery({ queryKey: catalogQueryKeys.teams, queryFn: api.teams });
  const query = useMemo<Partial<WorkOrderListQuery>>(() => {
    const tableFilter = (id: string) => columnFilters.find((filter) => filter.id === id)?.value;
    const tableSearch = tableFilter('title') ?? tableFilter('teamName');
    const tableStatus = tableFilter('status');
    const tablePriority = tableFilter('priority');
    return {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      q: debouncedQ || (typeof tableSearch === 'string' ? tableSearch : undefined),
      status: status
        ? [status]
        : tableStatus === 'OPEN' ||
            tableStatus === 'ASSIGNED' ||
            tableStatus === 'IN_PROGRESS' ||
            tableStatus === 'CLOSED'
          ? [tableStatus]
          : undefined,
      priority:
        priority ||
        (tablePriority === 'LOW' ||
        tablePriority === 'MEDIUM' ||
        tablePriority === 'HIGH' ||
        tablePriority === 'CRITICAL'
          ? tablePriority
          : undefined),
      teamId: teamId || undefined,
      createdFrom: createdFrom?.toISOString(),
      createdTo: createdTo?.toISOString(),
      sortBy: (sorting[0]?.id as WorkOrderListQuery['sortBy']) || 'createdAt',
      sortDirection: sorting[0]?.desc ? 'desc' : 'asc',
    };
  }, [
    pagination,
    debouncedQ,
    status,
    priority,
    teamId,
    createdFrom,
    createdTo,
    sorting,
    columnFilters,
  ]);
  const orders = useQuery({
    queryKey: [...workOrderQueryKeys.all, query],
    queryFn: () => api.workOrders(query),
  });
  const create = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: () => {
      setShowForm(false);
      void client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const assign = useMutation({
    mutationFn: ({ id, team }: { id: string; team: string }) => api.assignWorkOrder(id, team),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const advance = useMutation({
    mutationFn: ({ id, next }: { id: string; next: WorkOrderStatus }) =>
      api.workOrderStatus(id, next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: workOrderQueryKeys.all });
    },
  });
  const table = useWorkOrderTable(
    orders.data?.data ?? [],
    orders.data?.meta.total ?? 0,
    orders.data?.meta.totalPages ?? 0,
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    teams.data ?? [],
    (id, team) => assign.mutate({ id, team }),
    (id, next) => advance.mutate({ id, next }),
  );
  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow={esCL.workOrders.eyebrow}
        title={esCL.workOrders.title}
        text={esCL.workOrders.description}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm((value) => !value)}
          >
            {esCL.workOrders.new}
          </Button>
        }
      />
      {showForm && (
        <WorkOrderForm
          teams={teams.data ?? []}
          pending={create.isPending}
          onSubmit={(body) => create.mutate(body)}
          onCancel={() => setShowForm(false)}
        />
      )}
      {orders.data && <OrderStatusSummary data={orders.data.data} />}
      {
        <FilterCard
          title="Filtros operacionales"
          onClear={() => {
            setQ('');
            setStatus('');
            setPriority('');
            setTeamId('');
            setCreatedFrom(null);
            setCreatedTo(null);
            setColumnFilters([]);
          }}
        >
          <TextField
            label="Buscar"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <SelectField
            label="Estado"
            value={status}
            onChange={(value) => setStatus(value as WorkOrderStatus | '')}
            options={[
              ['', 'Todos los estados'],
              ['OPEN', labelStatus('OPEN')],
              ['ASSIGNED', labelStatus('ASSIGNED')],
              ['IN_PROGRESS', labelStatus('IN_PROGRESS')],
              ['CLOSED', labelStatus('CLOSED')],
            ]}
          />
          <SelectField
            label="Prioridad"
            value={priority}
            onChange={(value) => setPriority(value as Priority | '')}
            options={[
              ['', 'Todas las prioridades'],
              ['LOW', labelSeverity('LOW')],
              ['MEDIUM', labelSeverity('MEDIUM')],
              ['HIGH', labelSeverity('HIGH')],
              ['CRITICAL', labelSeverity('CRITICAL')],
            ]}
          />
          <SelectField
            label="Equipo"
            value={teamId}
            onChange={setTeamId}
            options={[
              ['', 'Todos los equipos'],
              ...(teams.data ?? []).map((team) => [team.id, team.name] as [string, string]),
            ]}
          />
          <_DatePicker
            label="Desde"
            value={createdFrom}
            onChange={setCreatedFrom}
            slotProps={{ textField: { size: 'small' } }}
          />
          <_DatePicker
            label="Hasta"
            value={createdTo}
            onChange={setCreatedTo}
            slotProps={{ textField: { size: 'small' } }}
          />
        </FilterCard>
      }
      {orders.isError ? (
        <ErrorState error={orders.error} />
      ) : orders.isPending ? (
        <Loading />
      ) : orders.data.data.length === 0 ? (
        <Empty text={esCL.workOrders.empty} />
      ) : (
        <MaterialReactTable table={table} />
      )}
    </Stack>
  );
}

function useIncidentTable(
  data: IncidentResponse[],
  rowCount: number,
  pageCount: number,
  pagination: MRT_PaginationState,
  setPagination: Dispatch<SetStateAction<MRT_PaginationState>>,
  sorting: MRT_SortingState,
  setSorting: Dispatch<SetStateAction<MRT_SortingState>>,
  columnFilters: MRT_ColumnFiltersState,
  setColumnFilters: Dispatch<SetStateAction<MRT_ColumnFiltersState>>,
  take: (id: string) => void,
  resolve: (id: string) => void,
) {
  const columns = useMemo<MRT_ColumnDef<IncidentResponse>[]>(
    () => [
      { accessorKey: 'sensorCode', header: 'Sensor' },
      { accessorKey: 'areaName', header: 'Área' },
      {
        accessorKey: 'value',
        header: 'Lectura',
        Cell: ({ cell, row }) =>
          `${cell.getValue<number>()} (${row.original.minValue}–${row.original.maxValue})`,
      },
      {
        accessorKey: 'severity',
        header: 'Severidad',
        Cell: ({ cell }) => <SeverityChip severity={cell.getValue<IncidentSeverity>()} />,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        Cell: ({ cell }) => <StatusChip status={cell.getValue<IncidentStatus>()} />,
      },
      {
        accessorKey: 'openedAt',
        header: 'Detectado',
        Cell: ({ cell }) => formatDateTime(cell.getValue<string>()),
      },
    ],
    [],
  );
  return useMaterialReactTable({
    columns,
    data,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    enableColumnFilters: true,
    enableRowActions: true,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    rowCount,
    pageCount,
    state: { columnFilters, pagination, sorting },
    muiTableBodyRowProps: { className: 'list-row' },
    renderRowActions: ({ row }) => (
      <Stack direction="row" spacing={1}>
        <Button component={RouterLink} to={`/incidents/${row.original.id}`} size="small">
          Detalle
        </Button>
        {row.original.status === 'OPEN' && (
          <Button size="small" onClick={() => take(row.original.id)}>
            Tomar
          </Button>
        )}
        {row.original.status === 'ACKNOWLEDGED' && (
          <Button size="small" onClick={() => resolve(row.original.id)}>
            Resolver
          </Button>
        )}
      </Stack>
    ),
  });
}

function useWorkOrderTable(
  data: WorkOrderResponse[],
  rowCount: number,
  pageCount: number,
  pagination: MRT_PaginationState,
  setPagination: Dispatch<SetStateAction<MRT_PaginationState>>,
  sorting: MRT_SortingState,
  setSorting: Dispatch<SetStateAction<MRT_SortingState>>,
  columnFilters: MRT_ColumnFiltersState,
  setColumnFilters: Dispatch<SetStateAction<MRT_ColumnFiltersState>>,
  teams: Team[],
  assign: (id: string, team: string) => void,
  advance: (id: string, next: WorkOrderStatus) => void,
) {
  const columns = useMemo<MRT_ColumnDef<WorkOrderResponse>[]>(
    () => [
      { accessorKey: 'title', header: 'Orden' },
      {
        accessorKey: 'priority',
        header: 'Prioridad',
        Cell: ({ cell }) => <SeverityChip severity={cell.getValue<Priority>()} />,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        Cell: ({ cell }) => <StatusChip status={cell.getValue<WorkOrderStatus>()} />,
      },
      {
        accessorKey: 'teamName',
        header: 'Equipo',
        Cell: ({ cell }) => cell.getValue<string | null>() ?? esCL.workOrders.noTeam,
      },
      {
        accessorKey: 'createdAt',
        header: 'Creada',
        Cell: ({ cell }) => formatDateTime(cell.getValue<string>()),
      },
    ],
    [],
  );
  return useMaterialReactTable({
    columns,
    data,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    enableColumnFilters: true,
    enableRowActions: true,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    rowCount,
    pageCount,
    state: { columnFilters, pagination, sorting },
    muiTableBodyRowProps: { className: 'list-row' },
    renderRowActions: ({ row }) => (
      <Stack direction="row" spacing={1} alignItems="center">
        {row.original.status === 'OPEN' && (
          <Select
            native
            size="small"
            defaultValue=""
            displayEmpty
            inputProps={{ 'aria-label': esCL.workOrders.assignAria(row.original.title) }}
            onChange={(event) => {
              if (event.target.value) assign(row.original.id, event.target.value);
            }}
          >
            <option value="">Asignar</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        )}
        {row.original.status === 'ASSIGNED' && (
          <Button size="small" onClick={() => advance(row.original.id, 'IN_PROGRESS')}>
            {esCL.workOrders.start}
          </Button>
        )}
        {row.original.status === 'IN_PROGRESS' && (
          <Button size="small" onClick={() => advance(row.original.id, 'CLOSED')}>
            {esCL.workOrders.close}
          </Button>
        )}
      </Stack>
    ),
  });
}

function WorkOrderForm({
  incidentId,
  teams: _teams,
  pending,
  onSubmit,
  onCancel,
}: {
  incidentId?: string;
  teams: Team[];
  pending: boolean;
  onSubmit: (body: {
    title: string;
    description?: string;
    priority: string;
    incidentId?: string;
  }) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  return (
    <Card>
      <CardContent>
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ title, description: description || undefined, priority, incidentId });
          }}
        >
          <SectionHeading title={esCL.workOrders.createTitle} />
          <TextField
            label={esCL.workOrders.titleLabel}
            inputProps={{ 'aria-label': esCL.workOrders.titleLabel }}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <TextField
            label={esCL.workOrders.descriptionLabel}
            inputProps={{ 'aria-label': esCL.workOrders.descriptionLabel }}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={3}
          />
          <SelectField
            label={esCL.workOrders.priority}
            value={priority}
            onChange={setPriority}
            options={[
              ['LOW', labelSeverity('LOW')],
              ['MEDIUM', labelSeverity('MEDIUM')],
              ['HIGH', labelSeverity('HIGH')],
              ['CRITICAL', labelSeverity('CRITICAL')],
            ]}
          />
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" disabled={pending || title.trim().length < 3}>
              {pending ? esCL.workOrders.creating : esCL.workOrders.create}
            </Button>
            {onCancel && <Button onClick={onCancel}>{esCL.workOrders.cancel}</Button>}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function FilterCard({
  title,
  onClear,
  children,
}: {
  title: string;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Button startIcon={<ClearIcon />} onClick={onClear}>
          Limpiar filtros
        </Button>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' },
          gap: 1.5,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        native
        label={label}
        inputProps={{ 'aria-label': label }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}
function PageHeading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ sm: 'center' }}
      gap={2}
    >
      <Box>
        <Typography variant="overline" color="primary">
          {eyebrow}
        </Typography>
        <Typography variant="h3" component="h1">
          {title}
        </Typography>
        {text && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {text}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}
function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {action}
    </Stack>
  );
}
function Metric({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  tone?: 'error' | 'primary';
  hint?: string;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Card sx={{ borderColor: tone ? `${tone}.main` : undefined }}>
        <CardContent>
          <Typography color="text.secondary">{label}</Typography>
          <Typography variant="h2" sx={{ mt: 1 }}>
            {value}
          </Typography>
          {hint && <Typography color="text.secondary">{hint}</Typography>}
        </CardContent>
      </Card>
    </Grid>
  );
}
function PriorityList({ data }: { data: IncidentResponse[] }) {
  return (
    <Card>
      <CardContent>
        <SectionHeading
          title={esCL.dashboard.priorityIncidents}
          action={
            <Button component={RouterLink} to="/incidents">
              {esCL.dashboard.seeAll}
            </Button>
          }
        />
        {data.length === 0 ? (
          <Empty text={esCL.incidents.empty} />
        ) : (
          <Stack divider={<Divider />} spacing={0}>
            {data.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 1.5, gap: 1 }}
              >
                <Box>
                  <Typography fontWeight={700}>{item.sensorCode}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.areaName} · {item.value} ({item.minValue}–{item.maxValue})
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <SeverityChip severity={item.severity} />
                  <StatusChip status={item.status} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
function Distribution({ data }: { data: IncidentResponse[] }) {
  const counts = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IncidentSeverity[]).map((severity) => ({
    severity,
    count: data.filter((item) => item.severity === severity).length,
  }));
  const max = Math.max(...counts.map((item) => item.count), 1);
  return (
    <Card>
      <CardContent>
        <SectionHeading title={esCL.dashboard.severityDistribution} />
        {counts.map((item) => (
          <Stack
            key={item.severity}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography sx={{ width: 72 }} color="text.secondary">
              {labelSeverity(item.severity)}
            </Typography>
            <Box sx={{ flex: 1, height: 8, bgcolor: 'action.hover', borderRadius: 4 }}>
              <Box
                sx={{
                  width: `${(item.count / max) * 100}%`,
                  height: '100%',
                  bgcolor:
                    item.severity === 'CRITICAL'
                      ? 'error.main'
                      : item.severity === 'MEDIUM'
                        ? 'warning.main'
                        : 'info.main',
                  borderRadius: 4,
                }}
              />
            </Box>
            <Typography sx={{ width: 24, textAlign: 'right' }}>{item.count}</Typography>
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
}
function OrderPreview({ data }: { data: WorkOrderResponse[] }) {
  if (!data.length) return <Empty text={esCL.workOrders.empty} />;
  return (
    <Stack divider={<Divider />} spacing={0}>
      {data.map((item) => (
        <Stack key={item.id} direction="row" justifyContent="space-between" sx={{ py: 1.25 }}>
          <Box>
            <Typography fontWeight={600}>{item.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {labelSeverity(item.priority)} · {item.teamName ?? esCL.workOrders.noTeam} ·{' '}
              {formatDateTime(item.createdAt)}
            </Typography>
          </Box>
          <StatusChip status={item.status} />
        </Stack>
      ))}
    </Stack>
  );
}
function OrderStatusSummary({ data }: { data: WorkOrderResponse[] }) {
  const labels: Record<WorkOrderStatus, string> = {
    OPEN: 'Abiertas',
    ASSIGNED: 'Asignadas',
    IN_PROGRESS: 'En progreso',
    CLOSED: 'Cerradas',
  };
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED'] as WorkOrderStatus[]).map((status) => (
        <Stack key={status} direction="row" spacing={0.5} alignItems="center">
          <Chip label={labels[status]} variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            {data.filter((item) => item.status === status).length}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
    >
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Stack>
  );
}
function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      label={labelStatus(status)}
      color={
        status === 'CLOSED' || status === 'RESOLVED'
          ? 'success'
          : status === 'IN_PROGRESS'
            ? 'info'
            : status === 'ACKNOWLEDGED' || status === 'ASSIGNED'
              ? 'warning'
              : 'error'
      }
    />
  );
}
function SeverityChip({ severity }: { severity: string }) {
  return (
    <Chip
      size="small"
      label={labelSeverity(severity)}
      color={
        severity === 'CRITICAL' || severity === 'HIGH'
          ? 'error'
          : severity === 'MEDIUM'
            ? 'warning'
            : 'success'
      }
    />
  );
}
function PageState({ title, text }: { title: string; text: string }) {
  return (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <Stack alignItems="center" spacing={1}>
        <CircularProgress size={28} />
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary">{text}</Typography>
      </Stack>
    </Box>
  );
}
function Loading() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <Paper sx={{ p: 5, textAlign: 'center' }}>
      <Typography color="text.secondary">{esCL.state.noResults}</Typography>
      <Typography sx={{ mt: 1 }}>{text}</Typography>
    </Paper>
  );
}
function ErrorState({ error }: { error: Error | null }) {
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  return (
    <Alert severity="error">
      {error?.message ?? esCL.state.dataLoadFailed}
      {requestId ? ` · request-id: ${requestId}` : ''}
    </Alert>
  );
}
function averageClosureHours(orders: WorkOrderResponse[]): number {
  const closed = orders.filter((item) => item.closedAt);
  if (!closed.length) return 0;
  const total = closed.reduce(
    (sum, item) =>
      sum +
      (new Date(item.closedAt ?? item.createdAt).getTime() - new Date(item.createdAt).getTime()) /
        3_600_000,
    0,
  );
  return Math.round((total / closed.length) * 10) / 10;
}
function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default App;
