import { Box, Divider, Stack, Typography } from '@mui/material';
import type { WorkOrderResponse } from '@faena/contracts';
import { esCL, formatDateTime, labelSeverity } from '@faena/contracts';
import { Empty } from '../../components/Empty';
import { StatusChip } from '../../components/StatusChip';

export function OrderPreview({ data }: { data: WorkOrderResponse[] }) {
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
