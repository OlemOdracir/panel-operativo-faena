import { readFile } from 'node:fs/promises';

const document = JSON.parse(
  (await readFile(new URL('../docs/openapi.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''),
);
const requiredPaths = [
  '/api/v1/health',
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/incidents',
  '/api/v1/work-orders',
  '/api/v1/readings',
];

if (document.openapi !== '3.0.0') {
  throw new Error(`Unsupported OpenAPI version: ${document.openapi}`);
}

for (const path of requiredPaths) {
  if (!document.paths?.[path]) {
    throw new Error(`Missing required OpenAPI path: ${path}`);
  }
}

console.log(`OpenAPI contract valid: ${Object.keys(document.paths).length} paths`);
