import {Browser, expect, Locator, Page, TestInfo} from '@playwright/test';

/** Un móvil más en la mesa: contexto propio (sessionStorage separado), mismo tamaño de pantalla. */
export async function newPhone(browser: Browser, testInfo: TestInfo): Promise<Page> {
  const { viewport, isMobile, hasTouch, deviceScaleFactor, locale } = testInfo.project.use;
  const context = await browser.newContext({ viewport, isMobile, hasTouch, deviceScaleFactor, locale, baseURL: testInfo.project.use.baseURL });
  return context.newPage();
}

export async function createRoom(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await page.getByPlaceholder(/Ej:/).fill(name);
  await page.getByRole('button', { name: /Crear sala/ }).click();
  await page.waitForURL(/\/r\/[A-Z0-9]{4}$/);
  return page.url().match(/\/r\/([A-Z0-9]{4})$/)![1];
}

export async function joinRoom(page: Page, roomCode: string, name: string): Promise<void> {
  await page.goto(`/r/${roomCode}`);
  await page.getByPlaceholder(/Ej:/).fill(name);
  await page.getByRole('button', { name: /Entrar a la sala/ }).click();
}

/** Mantener pulsado (falta y herramientas). */
export async function hold(page: Page, button: Locator, ms = 700): Promise<void> {
  await button.hover();
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** El primer móvil que muestra ese botón (p. ej. quién es ahora el artificiero). */
export async function phoneWithButton(pages: Page[], name: RegExp): Promise<Page> {
  await expect
    .poll(async () => {
      for (const p of pages) if (await p.getByRole('button', { name }).count()) return true;
      return false;
    })
    .toBe(true);
  for (const p of pages) if (await p.getByRole('button', { name }).count()) return p;
  throw new Error(`No phone shows ${name}`);
}

/**
 * Reglas mobile first que debe cumplir cada pantalla: sin scroll horizontal y la acción
 * principal entera dentro de la pantalla, sin tener que hacer scroll.
 */
export async function expectMobileFriendly(page: Page, mainAction?: Locator): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);

  if (mainAction) {
    await expect(mainAction).toBeVisible();
    const box = await mainAction.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box, 'main action is rendered').not.toBeNull();
    expect(box!.y + box!.height, 'main action fits on screen').toBeLessThanOrEqual(viewport.height + 1);
    expect(box!.height, 'main action is a comfortable touch target').toBeGreaterThanOrEqual(44);
  }
}

/** Captura adjunta al informe (y guardada en e2e-results) para revisar el aspecto a ojo. */
export async function snapshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.waitForTimeout(300);
  await testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' });
}
