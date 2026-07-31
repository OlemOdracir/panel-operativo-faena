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
  const sidebar = page.getByRole('navigation', { name: 'Navegación principal' });
  const footer = page.getByRole('contentinfo');
  const sidebarBeforeFilter = await sidebar.boundingBox();
  const footerBeforeFilter = await footer.boundingBox();

  await page.getByLabel('Buscar incidente').fill('sin-coincidencias');
  await expect(page.getByText('No hay incidentes que coincidan con los filtros.')).toBeVisible();

  const sidebarAfterFilter = await sidebar.boundingBox();
  const footerAfterFilter = await footer.boundingBox();
  expect(sidebarAfterFilter?.height).toBe(sidebarBeforeFilter?.height);
  expect(footerAfterFilter?.y).toBe(footerBeforeFilter?.y);
  const viewport = page.viewportSize();
  expect((footerAfterFilter?.y ?? 0) + (footerAfterFilter?.height ?? 0)).toBe(viewport?.height);

  await page.getByRole('link', { name: 'Órdenes de trabajo' }).click();
  await expect(page.getByRole('heading', { name: 'Órdenes de trabajo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva orden' })).toBeVisible();
  expect(unexpectedConsoleErrors).toEqual([]);
});

// Las mutaciones de estado nunca se ejercitaban contra la API real: las
// pruebas de servicio no atraviesan la capa de pipes y las de frontend simulan
// `fetch`. Por eso un 400 en `PATCH /incidents/:id/status` llegó a producción.
test('taking an incident reaches the API without a validation error', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/status') && !response.ok()) {
      failed.push(`${response.request().method()} ${response.url()} -> ${response.status()}`);
    }
  });

  await page.goto('/');
  await page.getByLabel('Correo').fill('supervisor@faena.local');
  await page.getByLabel('Contraseña').fill(supervisorPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await page.getByRole('link', { name: 'Incidentes' }).click();
  await expect(page.getByRole('heading', { name: 'Incidentes', exact: true })).toBeVisible();
  await expect(page.locator('.list-row').first()).toBeVisible();

  const take = page.getByRole('button', { name: 'Tomar', exact: true }).first();
  await expect(take).toBeVisible();
  const openBefore = await page.getByRole('button', { name: 'Tomar', exact: true }).count();
  await take.click();

  // Ninguna acción se ejecuta sin pasar por el diálogo de confirmación.
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Tomar incidente' }).click();
  await expect(dialog).toBeHidden();

  // Al reconocerse, el incidente deja de ofrecer «Tomar» y pasa a «Resolver».
  await expect(page.getByRole('button', { name: 'Tomar', exact: true })).toHaveCount(
    openBefore - 1,
  );
  expect(failed).toEqual([]);
});

test('cancelling the confirmation leaves the incident untouched', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('supervisor@faena.local');
  await page.getByLabel('Contraseña').fill(supervisorPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await page.getByRole('link', { name: 'Incidentes' }).click();
  await expect(page.locator('.list-row').first()).toBeVisible();

  const resolve = page.getByRole('button', { name: 'Resolver', exact: true }).first();
  await expect(resolve).toBeVisible();
  const before = await page.getByRole('button', { name: 'Resolver', exact: true }).count();

  await resolve.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByRole('button', { name: 'Resolver', exact: true })).toHaveCount(before);
});

test('administrator session retains the admin role', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('admin@faena.local');
  await page.getByLabel('Contraseña').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page.getByRole('heading', { name: 'Estado de la faena' })).toBeVisible();
  await expect(page.getByText(/Administrador/)).toBeVisible();
});

test('mobile shell opens a temporary drawer and closes after navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Correo').fill('supervisor@faena.local');
  await page.getByLabel('Contraseña').fill(supervisorPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Estado de la faena' })).toBeVisible();

  await page.getByRole('button', { name: 'Abrir menú' }).click();
  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Incidentes' }).click();
  await expect(page.getByRole('heading', { name: 'Incidentes', exact: true })).toBeVisible();
  await expect(navigation).toBeHidden();
});

test('keyboard users can tab through the primary navigation and activate a link', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('supervisor@faena.local');
  await page.getByLabel('Contraseña').fill(supervisorPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Estado de la faena' })).toBeVisible();

  const dashboardLink = page.getByRole('link', { name: 'Resumen' });
  const incidentsLink = page.getByRole('link', { name: 'Incidentes' });
  const workOrdersLink = page.getByRole('link', { name: 'Órdenes de trabajo' });

  await dashboardLink.focus();
  await expect(dashboardLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(incidentsLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(workOrdersLink).toBeFocused();

  await incidentsLink.focus();
  await expect(incidentsLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Incidentes', exact: true })).toBeVisible();
});

test('collapses the desktop navigation drawer with the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo').fill('supervisor@faena.local');
  await page.getByLabel('Contraseña').fill(supervisorPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Estado de la faena' })).toBeVisible();

  const toggle = page.getByRole('button', { name: 'Colapsar menú' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Expandir menú' })).toBeVisible();

  await page.getByRole('button', { name: 'Expandir menú' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Colapsar menú' })).toBeVisible();
});

test('opens the mobile drawer with the keyboard and restores focus after closing with Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Correo').fill('supervisor@faena.local');
  await page.getByLabel('Contraseña').fill(supervisorPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Estado de la faena' })).toBeVisible();

  const menuButton = page.getByRole('button', { name: 'Abrir menú' });
  await menuButton.focus();
  await page.keyboard.press('Enter');

  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(navigation).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(navigation).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test('API rejects operational data without a session', async () => {
  const client = await request.newContext();
  const response = await client.get(`${apiURL}/incidents`);
  expect(response.status()).toBe(401);
  await client.dispose();
});
