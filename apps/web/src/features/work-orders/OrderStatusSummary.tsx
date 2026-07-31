import { Chip, Stack, Typography } from '@mui/material';
import type { WorkOrderResponse, WorkOrderStatus } from '@faena/contracts';

export function OrderStatusSummary({ data }: { data: WorkOrderResponse[] }) {
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
