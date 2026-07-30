import { Button, Card, CardContent, Grid, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IconRefresh as RefreshIcon } from '../../app/icons';
import { esCL } from '@faena/contracts';
import { api } from '../../api';
import { incidentQueryKeys } from '../incidents/query-keys';
import { workOrderQueryKeys } from '../work-orders/query-keys';
import { catalogQueryKeys } from '../catalog/query-keys';
import { PageHeading } from '../../components/PageHeading';
import { PageState } from '../../components/PageState';
import { ErrorState } from '../../components/ErrorState';
import { Metric } from '../../components/Metric';
import { SectionHeading } from '../../components/SectionHeading';
import { PriorityList } from './PriorityList';
import { Distribution } from './Distribution';
import { OrderPreview } from './OrderPreview';
import { averageClosureHours } from './dashboard.utils';

export function DashboardPage() {
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
