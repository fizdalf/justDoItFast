import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppServer, createServer} from '../../src/server/server.js';

describe('Server REST API: Deck Catalog & Protected Admin Endpoints', () => {
  let server: AppServer;
  let baseUrl: string;
  const adminToken = 'test-secret-token-123';

  beforeAll(async () => {
    server = await createServer({
      port: 0,
      adminToken,
    });
    const addr = await server.start(0, '127.0.0.1');
    const port = (server.app.server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/categories returns unique categories without auth', async () => {
    const res = await fetch(`${baseUrl}/api/categories`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toContain('Clásico');
  });

  it('GET /api/packs returns list of packs with optional filters', async () => {
    const res = await fetch(`${baseUrl}/api/packs?category=Clásico`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((p: any) => p.category === 'Clásico')).toBe(true);
  });

  it('GET /api/packs/:id returns single pack or 404', async () => {
    const resOk = await fetch(`${baseUrl}/api/packs/classic-1996`);
    expect(resOk.status).toBe(200);
    const bodyOk = await resOk.json();
    expect(bodyOk.data.id).toBe('classic-1996');

    const res404 = await fetch(`${baseUrl}/api/packs/non-existent-pack`);
    expect(res404.status).toBe(404);
  });

  it('GET /api/admin/packs rejects requests without valid admin token', async () => {
    const resNoToken = await fetch(`${baseUrl}/api/admin/packs`);
    expect(resNoToken.status).toBe(401);

    const resWrongToken = await fetch(`${baseUrl}/api/admin/packs`, {
      headers: { 'x-admin-token': 'wrong-token' },
    });
    expect(resWrongToken.status).toBe(401);
  });

  it('GET /api/admin/packs accepts requests with x-admin-token header or Bearer authorization', async () => {
    const resHeader = await fetch(`${baseUrl}/api/admin/packs`, {
      headers: { 'x-admin-token': adminToken },
    });
    expect(resHeader.status).toBe(200);
    const bodyHeader = await resHeader.json();
    expect(bodyHeader.success).toBe(true);
    expect(bodyHeader.data.length).toBeGreaterThanOrEqual(4);
    expect(bodyHeader.data[0].totalWords).toBeDefined();

    const resBearer = await fetch(`${baseUrl}/api/admin/packs`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(resBearer.status).toBe(200);
  });

  it('POST /api/admin/packs creates a new pack when authorized', async () => {
    const res = await fetch(`${baseUrl}/api/admin/packs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        name: 'Anime & Manga',
        description: 'Packs de animación japonesa',
        category: 'Entretenimiento',
        words: ['NARUTO', 'GOKU', 'LUFFY', 'TITAN', 'KAMEHAMEHA', 'SHINIGAMI'],
        isPremium: true,
        priceTier: 'TIER_1',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe('Anime & Manga');

    // Verify it is visible via public API
    const checkRes = await fetch(`${baseUrl}/api/packs/${body.data.id}`);
    expect(checkRes.status).toBe(200);
  });

  it('PUT /api/admin/packs/:id updates an existing pack', async () => {
    const res = await fetch(`${baseUrl}/api/admin/packs/classic-1996`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        description: 'Descripción actualizada por el panel de administración',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.description).toBe('Descripción actualizada por el panel de administración');
  });

  it('DELETE /api/admin/packs/:id removes a pack from catalog', async () => {
    // Create pack first
    const createRes = await fetch(`${baseUrl}/api/admin/packs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        id: 'pack-to-delete',
        name: 'Temporal',
        description: 'Borrar',
        category: 'Test',
        words: ['UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO'],
      }),
    });
    expect(createRes.status).toBe(201);

    // Delete it
    const delRes = await fetch(`${baseUrl}/api/admin/packs/pack-to-delete`, {
      method: 'DELETE',
      headers: { 'x-admin-token': adminToken },
    });
    expect(delRes.status).toBe(200);

    // Verify it is gone
    const checkRes = await fetch(`${baseUrl}/api/packs/pack-to-delete`);
    expect(checkRes.status).toBe(404);
  });

  it('GET /api/admin/packs/export and POST /api/admin/packs/import work seamlessly', async () => {
    const exportRes = await fetch(`${baseUrl}/api/admin/packs/export`, {
      headers: { 'x-admin-token': adminToken },
    });
    expect(exportRes.status).toBe(200);
    const exportBody = await exportRes.json();
    expect(exportBody.data.length).toBeGreaterThan(0);

    const importRes = await fetch(`${baseUrl}/api/admin/packs/import`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        packs: [
          {
            id: 'imported-pack-1',
            name: 'Imported Pack',
            description: 'Pack importado',
            category: 'Import',
            isPremium: false,
            priceTier: 'FREE',
            words: ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON'],
          },
        ],
        overwrite: true,
      }),
    });

    expect(importRes.status).toBe(200);
    const importBody = await importRes.json();
    expect(importBody.data.imported).toBe(1);

    const verifyImport = await fetch(`${baseUrl}/api/packs/imported-pack-1`);
    expect(verifyImport.status).toBe(200);
  });
});
