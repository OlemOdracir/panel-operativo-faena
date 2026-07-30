import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { IncidentResponse } from '@faena/contracts';
import { esCL, formatMeasurement } from '@faena/contracts';
import { SectionHeading } from '../../components/SectionHeading';
import { Empty } from '../../components/Empty';
import { SeverityChip } from '../../components/SeverityChip';
import { StatusChip } from '../../components/StatusChip';

export function PriorityList({ data }: { data: IncidentResponse[] }) {
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
                    {item.areaName} · {formatMeasurement(item.value, item.unit)} ·{' '}
                    {esCL.reading.rangeLabel} {formatMeasurement(item.minValue)}–
                    {formatMeasurement(item.maxValue, item.unit)}
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
