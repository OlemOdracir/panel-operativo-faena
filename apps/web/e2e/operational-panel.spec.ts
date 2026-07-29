import { expect, request, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const environment = existsSync('.env')
  ? Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter((line) => line.includes('='))
        .map((line) => line.split('=', 2)),
    )
  : {};

const supervisorPassword =
  process.env.E2E_SUPERVISOR_PASSWORD ?? environment.SEED_SUPERVISOR_PASSWORD;
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? environment.SEED_ADMIN_PASSWORD;
const apiURL = process.env.E2E_API_URL ?? 'http://localhost:13000/api/v1';

test('supervisor can monitor incidents and work orders', async ({ page }) => {
  const unexpectedConsoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('401')) {
      unexpectedConsoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => unexpectedConsoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ingresa a la faena' })).toBeVisible();
  await page.getByLabel('Correo').fill('supervisor@faena.local');
  await page.getByLabel('Contraseña').fill(supervisorPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page.getByRole('heading', { name: 'Estado de la faena' })).toBeVisible();
  await expect(page.getByText('Incidentes abiertos', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prioridades operativas' })).toBeVisible();
  await expect(page.getByText('Filtrar incidentes')).toHaveCount(0);
  await expect(page.getByText('No se pudo cargar el resumen')).toHaveCount(0);

  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'faena_session',
  );
  expect(sessionCookie?.httpOnly).toBe(true);

  await page.getByRole('link', { name: 'Incidentes' }).click();
  await expect(page.getByRole('heading', { name: 'Incidentes', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Filtrar incidentes' })).toBeVisible();
  await expect(page.locator('.list-row').first()).toBeVisible();

  await page.getByRole('link', { name: 'Órdenes de trabajo' }).click();
  await expect(page.getByRole('heading', { name: 'Órdenes de trabajo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva orden' })).toBeVisible();
  expect(unexpectedConsoleErrors).toEqual([]);
});

test('administrator session retains the admin role', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('admin@faena.local');
  await page.getByLabel('Contraseña').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page.getByRole('heading', { name: 'Estado de la faena' })).toBeVisible();
  await expect(page.getByText(/Administrador/)).toBeVisible();
});

test('API rejects operational data without a session', async () => {
  const client = await request.newContext();
  const response = await client.get(`${apiURL}/incidents`);
  expect(response.status()).toBe(401);
  await client.dispose();
});
