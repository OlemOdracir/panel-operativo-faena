import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { esCL } from '@faena/contracts';
import { api } from '../../api';
import { authQueryKeys } from './query-keys';

export function LoginPage() {
  const client = useQueryClient();
  const [email, setEmail] = useState('supervisor@faena.local');
  const [password, setPassword] = useState('');
  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (user) => client.setQueryData(authQueryKeys.me, user),
  });
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Card sx={{ width: 'min(100%, 440px)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack
            spacing={3}
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              login.mutate();
            }}
          >
            <Box>
              <Typography variant="overline" color="primary">
                {esCL.app.operationalPanel}
              </Typography>
              <Typography variant="h4" component="h1" sx={{ mt: 1 }}>
                {esCL.auth.loginTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {esCL.auth.loginDescription}
              </Typography>
            </Box>
            <TextField
              label={esCL.auth.email}
              inputProps={{ 'aria-label': esCL.auth.email }}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              label={esCL.auth.password}
              inputProps={{ 'aria-label': esCL.auth.password }}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {login.isError && <Alert severity="error">{esCL.auth.loginFailed}</Alert>}
            <Button type="submit" variant="contained" disabled={login.isPending}>
              {login.isPending ? esCL.auth.loggingIn : esCL.auth.login}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
