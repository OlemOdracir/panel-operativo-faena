export const incidentQueryKeys = {
  all: ['incidents'] as const,
  detail: (id: string) => ['incident', id] as const,
};
