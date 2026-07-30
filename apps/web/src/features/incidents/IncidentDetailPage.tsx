import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IncidentStatus } from '@faena/contracts';
import { esCL, formatDateTime } from '@faena/contracts';
import { api } from '../../api';
import { incidentQueryKeys } from './query-keys';
import { workOrderQueryKeys } from '../work-orders/query-keys';
import { WorkOrderForm } from '../work-orders/WorkOrderForm';
import { PageHeading } from '../../components/PageHeading';
import { SectionHeading } from '../../components/SectionHeading';
import { DetailRow } from '../../components/DetailRow';
import { ReadingCell } from '../../components/ReadingCell';
import { StatusChip } from '../../components/StatusChip';
import { SeverityChip } from '../../components/SeverityChip';
import { Loading } from '../../components/Loading';
import { ErrorState } from '../../components/ErrorState';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { IconAdd, IconBack, IconResolve, IconTake } from '../../app/icons';

export function IncidentDetailPage() {
  const { id = '' } = useParams();
  const client = useQueryClient();
  const incident = useQuery({
    queryKey: incidentQueryKeys.detail(id),
    queryFn: () => api.incident(id),
    enabled: Boolean(id),
  });
  // Cambiar la llave remonta el formulario, que es la forma de React de
  // devolverlo a su estado inicial para la próxima vez que se abra el modal.
  const [createdCount, setCreatedCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const create = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: () => {
      setCreatedCount((count) => count + 1);
      setFormOpen(false);
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
              <DetailRow label={esCL.incidents.detected} value={formatDateTime(item.openedAt)} />
              <Box sx={{ mt: 2 }}>
                <ReadingCell
                  label={esCL.incidents.outOfRangeReading}
                  value={item.value}
                  unit={item.unit}
                  minValue={item.minValue}
                  maxValue={item.maxValue}
                  severity={item.severity}
                />
              </Box>
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
          <Card>
            <CardContent>
              <SectionHeading
                title={esCL.workOrders.createTitle}
                action={
                  <Button
                    variant="contained"
                    startIcon={<IconAdd />}
                    onClick={() => setFormOpen(true)}
                  >
                    {esCL.workOrders.new}
                  </Button>
                }
              />
              {/* `isSuccess` vuelve a false en cuanto se envía otra orden, así
                  que el aviso acompaña a la creación y no se queda pegado. */}
              {create.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {esCL.workOrders.created}
                </Alert>
              )}
              <Typography color="text.secondary">
                {esCL.workOrders.createFromIncidentHint}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Sin `aria-labelledby`: el título accesible del diálogo lo aporta el
          `SectionHeading` que ya renderiza `WorkOrderForm` (rol heading), no
          hace falta duplicarlo con un id inventado. */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <WorkOrderForm
            key={createdCount}
            embedded
            incidentId={item.id}
            pending={create.isPending}
            onSubmit={(body) => create.mutate(body)}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {confirm.dialog}
    </Stack>
  );
}
