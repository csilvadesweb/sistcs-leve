import { expect, test } from '@playwright/test';

test.describe('telas públicas', () => {
  test('mostra a tela de entrada com e-mail, senha e recuperação', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Esqueci minha senha' })).toBeVisible();
  });

  test('recuperação de senha não pede senha e oferece enviar o link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
    await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
    await expect(page.getByLabel('Senha')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Enviar link' })).toBeVisible();
    await page.getByRole('button', { name: 'Enviar link' }).click();
    await expect(page.getByRole('alert')).toContainText('Informe o e-mail');
  });

  test('cadastro exige senha de 8 caracteres e aceite da política', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Criar conta' }).first().click();
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
    await page.getByLabel('E-mail').fill('teste@example.com');
    await page.getByLabel('Senha').fill('1234567');
    await page.getByRole('button', { name: 'Criar conta' }).last().click();
    await expect(page.getByRole('alert')).toContainText('pelo menos 8 caracteres');
    await page.getByLabel('Senha').fill('12345678');
    await page.getByRole('button', { name: 'Criar conta' }).last().click();
    await expect(page.getByRole('alert')).toContainText('Política de Privacidade');
  });

  test('política de privacidade abre sem login e cita a IA', async ({ page }) => {
    await page.goto('/#/privacidade');
    await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible();
    await expect(page.getByText('Google Gemini').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar ao aplicativo' })).toBeVisible();
  });

  test('não há rolagem horizontal nas telas públicas', async ({ page }) => {
    for (const path of ['/', '/#/privacidade']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `rolagem horizontal em ${path}`).toBeLessThanOrEqual(1);
    }
  });

  test('manifesto do PWA e service worker são servidos', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBe(true);
    expect((await manifest.json()).name).toBeTruthy();
    expect((await request.get('/sw.js')).ok()).toBe(true);
  });

  test('assetlinks.json do app Android é servido', async ({ request }) => {
    const res = await request.get('/.well-known/assetlinks.json');
    expect(res.ok()).toBe(true);
    const links = await res.json();
    expect(links[0].target.package_name).toBe('com.sistcs.leve');
    expect(links[0].target.sha256_cert_fingerprints[0]).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  });
});
