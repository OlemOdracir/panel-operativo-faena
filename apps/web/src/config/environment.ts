import { z } from 'zod';

const clientEnvironmentSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3000/api/v1'),
});

export const clientEnvironment = clientEnvironmentSchema.parse(import.meta.env);
