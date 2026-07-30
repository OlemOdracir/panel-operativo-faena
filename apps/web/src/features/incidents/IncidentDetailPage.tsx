import { Button, Card, CardContent, Grid, Stack } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IncidentStatus } from '@faena/contracts';
import { esCL, formatDateTime } from '@faena/contracts';
import { api } from '../../api';
import { incidentQueryKeys } from './query-keys';
import { catalogQueryKeys } from '../catalog/query-keys';
import { workOrderQueryKeys } from '../work-orders/query-keys';
import { WorkOrderForm } from '../work-orders/WorkOrderForm';
import { PageHeading } from '../../components/PageHeading';
import { SectionHeading } from '../../components/SectionHeading';
import { DetailRow } from '../../components/DetailRow';
import { StatusChip } from '../../components/StatusChip';
import { SeverityChip } from '../../components/SeverityChip';
import { Loading } from '../../components/Loading';
import { ErrorState } from '../../components/ErrorState';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { IconBack, IconResolve, IconTake } from '../../app/icons';

export function IncidentDetailPage() {
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
  const confirm = useConfirmAction();
  if (incident.isPending) return <Loading />;
  if (incident.isError) return <ErrorState error={incident.error} />;
  const item = incident.data;
  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/incidents"
        startIcon={<IconBack />}
        sx={{ alignSelf: 'flex-start' }}
      >
        {esCL.incidents.title}
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
                    startIcon={<IconTake />}
                    onClick={() =>
                      confirm.request({
                        ...esCL.confirm.incidentTake,
                        tone: 'warning',
                        onConfirm: () => change.mutate({ next: 'ACKNOWLEDGED' }),
                      })
                    }
                  >
                    {esCL.incidents.takeIncident}
                  </Button>
                )}
                {item.status === 'ACKNOWLEDGED' && (
                  <Button
                    variant="contained"
                    startIcon={<IconResolve />}
                    onClick={() =>
                      confirm.request({
                        ...esCL.confirm.incidentResolve,
                        tone: 'good',
                        onConfirm: () => change.mutate({ next: 'RESOLVED' }),
                      })
                    }
                  >
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
      {confirm.dialog}
    </Stack>
  );
}
