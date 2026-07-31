import type { Role } from '@faena/contracts';

export type AuthenticatedUser = { id: string; email: string; name: string; role: Role };
