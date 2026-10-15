import {expect, Page, test} from '@playwright/test';
import {createRoom, expectMobileFriendly, hold, joinRoom, newPhone, phoneWithButton, snapshot} from './helpers.js';

const CUT = /CABLE CORTADO/;
const FOUL = /¡FALTA!/;

test('a whole game on phones: room, roles, foul, rounds, podium and back to the room', async ({ browser }, testInfo) => {
  const host = await newPhone(browser, testInfo);
  const code = await createRoom(host, 'Ana');
  await expectMobileFriendly(host);
  await snapshot(host, testInfo, 'room-alone');

  const guests: Page[] = [];
  for (const name of ['Bea', 'Carlos', 'Dani']) {
    const phone = await newPhone(browser, testInfo);
    await joinRoom(phone, code, name);
    guests.push(phone);
  }
  const players = [host, ...guests];

  // Todos ven a todos en la sala (regresión: al unirse la lista salía vacía)
  for (const phone of players) {
    for (const name of ['Ana', 'Bea', 'Carlos', 'Dani']) await expect(phone.getByText(name, { exact: true }).first()).toBeVisible();
  }

  const start = host.getByRole('button', { name: /Empezar partida/ });
  await expectMobileFriendly(host, start);
  await snapshot(host, testInfo, 'room-host');
  await snapshot(guests[0], testInfo, 'room-guest');

  // Partida corta
  await host.getByRole('button', { name: /Ajustes de la próxima partida/ }).click();
  const fewer = host.getByRole('button', { name: /Bajar: Puntos para ganar/ });
  await fewer.click();
  await fewer.click();
  await start.click();

  // Cada rol ve su pantalla, con su acción principal a mano
  const holder = await phoneWithButton(players, CUT);
  await expectMobileFriendly(holder, holder.getByRole('button', { name: CUT }));
  await snapshot(holder, testInfo, 'holder');

  const saboteur = await phoneWithButton(players.filter((p) => p !== holder), FOUL);
  await expectMobileFriendly(saboteur, saboteur.getByRole('button', { name: FOUL }));
  await snapshot(saboteur, testInfo, 'saboteur');

  const helpers = [];
  for (const p of players) if (p !== holder && !(await p.getByRole('button', { name: FOUL }).count())) helpers.push(p);
  expect(helpers).toHaveLength(1);
  await expect(helpers[0].getByText(/ADIVINA EN VOZ ALTA/)).toBeVisible();
  await snapshot(helpers[0], testInfo, 'helper');

  // El cable solo lo ven artificiero y saboteadores
  const word = (await holder.getByRole('heading', { level: 2 }).first().textContent())!.trim();
  await expect(saboteur.getByText(word, { exact: true })).toBeVisible();
  await expect(helpers[0].getByText(word, { exact: true })).toHaveCount(0);

  // Quien llega tarde es espectador y tampoco ve el cable
  const late = await newPhone(browser, testInfo);
  await joinRoom(late, code, 'Eva');
  await expect(late.getByText(/Partida en curso/i)).toBeVisible();
  await expect(late.getByText(word, { exact: true })).toHaveCount(0);
  await expectMobileFriendly(late);
  await snapshot(late, testInfo, 'spectator');

  // Falta: se canta manteniendo pulsado; un toque corto no hace nada
  await saboteur.getByRole('button', { name: FOUL }).click();
  await expect(host.getByText(/FALTA CANTADA/)).toHaveCount(0);
  await hold(saboteur, saboteur.getByRole('button', { name: FOUL }));
  const award = host.getByRole('button', { name: /Dar punto al Equipo Azul/ });
  await expectMobileFriendly(host, award);
  await snapshot(host, testInfo, 'dispute-host');

  // Tres puntos para el Azul: resumen de ronda y podio
  for (let round = 1; round <= 3; round++) {
    await host.getByRole('button', { name: /Dar punto al Equipo Azul/ }).click();
    if (round === 3) break;
    const next = host.getByRole('button', { name: /Siguiente ronda/ });
    await expectMobileFriendly(host, next);
    if (round === 1) await snapshot(host, testInfo, 'round-over');
    await next.click();
    const rival = await phoneWithButton(players.filter((p) => p !== late), FOUL);
    await hold(rival, rival.getByRole('button', { name: FOUL }));
  }

  const backToRoom = host.getByRole('button', { name: /Volver a la sala/ });
  await expect(host.getByText(/Ganador: Equipo Azul/i)).toBeVisible();
  await expectMobileFriendly(host, backToRoom);
  await snapshot(host, testInfo, 'podium');

  await backToRoom.click();
  await expect(host.getByText(/Partidas de la sala/i)).toBeVisible();
  await expect(host.getByRole('button', { name: /Empezar partida/ })).toBeVisible();
  await snapshot(host, testInfo, 'room-after-game');
});

test('reloading the page keeps you in the room as the same player', async ({ browser }, testInfo) => {
  const host = await newPhone(browser, testInfo);
  const code = await createRoom(host, 'Ana');
  const guest = await newPhone(browser, testInfo);
  await joinRoom(guest, code, 'Bea');
  await expect(guest.getByText('Ana', { exact: true }).first()).toBeVisible();

  await guest.reload();
  await expect(guest).toHaveURL(new RegExp(`/r/${code}$`));
  await expect(guest.getByText('Bea', { exact: true }).first()).toBeVisible();
  await expect(guest.getByText(/\(Tú\)/)).toBeVisible();
  await expect(guest.getByPlaceholder(/Ej:/)).toHaveCount(0);
});

test('the header menu holds the secondary controls and switches language', async ({ browser }, testInfo) => {
  const phone = await newPhone(browser, testInfo);
  await phone.goto('/');
  await expectMobileFriendly(phone, phone.getByRole('button', { name: /Crear sala/ }));

  await phone.getByRole('button', { name: 'Menú' }).click();
  await snapshot(phone, testInfo, 'menu');
  await phone.getByRole('button', { name: 'en', exact: true }).click();
  await expect(phone.getByText('Defuse it! Fast!').first()).toBeVisible();
});

test('the app is installable: manifest and icons are served', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).status()).toBe(200);
  }
});
