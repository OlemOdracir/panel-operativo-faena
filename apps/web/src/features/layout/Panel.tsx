import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
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
import { lazy, Suspense, useState } from 'react';
import { Link as RouterLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserResponse } from '@faena/contracts';
import { esCL, labelRole } from '@faena/contracts';
import { api } from '../../api';
import { authQueryKeys } from '../auth/query-keys';
import { incidentQueryKeys } from '../incidents/query-keys';
import { PageState } from '../../components/PageState';

const DashboardPage = lazy(() =>
  import('../dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const IncidentsPage = lazy(() =>
  import('../incidents/IncidentsPage').then((module) => ({ default: module.IncidentsPage })),
);
const IncidentDetailPage = lazy(() =>
  import('../incidents/IncidentDetailPage').then((module) => ({
    default: module.IncidentDetailPage,
  })),
);
const WorkOrdersPage = lazy(() =>
  import('../work-orders/WorkOrdersPage').then((module) => ({ default: module.WorkOrdersPage })),
);

const drawerWidth = 264;
const collapsedDrawerWidth = 72;

export function Panel({ user }: { user: UserResponse }) {
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
    onSuccess: () => client.invalidateQueries({ queryKey: authQueryKeys.me }),
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
          pb: 8,
        }}
      >
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: 1800, width: '100%', mx: 'auto' }}>
          <Suspense
            fallback={
              <PageState title={esCL.dashboard.loadingTitle} text={esCL.dashboard.loadingText} />
            }
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/incidents/:id" element={<IncidentDetailPage />} />
              <Route path="/work-orders" element={<WorkOrdersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Box>
        <Box
          component="footer"
          role="contentinfo"
          sx={{
            position: 'fixed',
            left: mobile ? 0 : `${expanded ? drawerWidth : collapsedDrawerWidth}px`,
            right: 0,
            bottom: 0,
            zIndex: (muiTheme) => muiTheme.zIndex.appBar,
            borderTop: 1,
            borderColor: 'divider',
            px: { xs: 2, md: 4 },
            py: 2,
            bgcolor: 'background.default',
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
