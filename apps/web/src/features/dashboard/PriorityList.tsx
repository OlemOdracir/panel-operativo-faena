import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { IncidentResponse } from '@faena/contracts';
import { esCL } from '@faena/contracts';
import { SectionHeading } from '../../components/SectionHeading';
import { Empty } from '../../components/Empty';
import { ReadingCell } from '../../components/ReadingCell';
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
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ py: 1.5, gap: 1.5 }}
              >
                <Box>
                  <Typography fontWeight={700}>{item.sensorCode}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.areaName}
                  </Typography>
                </Box>
                <ReadingCell
                  value={item.value}
                  unit={item.unit}
                  minValue={item.minValue}
                  maxValue={item.maxValue}
                  severity={item.severity}
                />
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
