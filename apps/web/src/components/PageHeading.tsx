import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageHeading({
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
