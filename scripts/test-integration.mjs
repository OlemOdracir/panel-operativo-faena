import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('.env')) {
  console.error(
    'Falta el archivo .env. Copia .env.example a .env y configúralo antes de continuar.',
  );
  process.exit(1);
}

const envFromFile = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    }),
);

const baseEnv = { ...process.env, ...envFromFile };

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...baseEnv, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('==> Levantando PostgreSQL de pruebas (Docker Compose)...');
run('docker', ['compose', 'up', '-d', '--wait', 'database']);

console.log('==> Aplicando migraciones de Prisma...');
run('corepack', ['pnpm', '--filter', '@faena/api', 'prisma:migrate']);

console.log('==> Sembrando datos de prueba...');
run('corepack', ['pnpm', '--filter', '@faena/api', 'prisma:seed']);

console.log('==> Ejecutando la suite de la API (incluida la integración real con PostgreSQL)...');
run('corepack', ['pnpm', '--filter', '@faena/api', 'test:ci'], { RUN_DB_INTEGRATION: 'true' });

console.log(
  '==> Listo. La base de datos de prueba sigue activa; usa `pnpm compose:down` para detenerla.',
);
