import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { IncidentResponse, IncidentSeverity } from '@faena/contracts';
import { esCL, labelSeverity } from '@faena/contracts';
import { SectionHeading } from '../../components/SectionHeading';

export function Distribution({ data }: { data: IncidentResponse[] }) {
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
