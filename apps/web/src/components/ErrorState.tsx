import { Alert } from '@mui/material';
import { esCL } from '@faena/contracts';
import { ApiError } from '../api';

export function ErrorState({ error }: { error: Error | null }) {
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  return (
    <Alert severity="error">
      {error?.message ?? esCL.state.dataLoadFailed}
      {requestId ? ` · request-id: ${requestId}` : ''}
    </Alert>
  );
}
