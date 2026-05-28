import { expect, test } from '@playwright/test';

const spaces = [
  {
    id: 1,
    displayName: 'Alfa - G2, 1. nadstropje',
    locationType: 'classroom',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 10,
    floorCode: '1_nadstropje',
    floorLabel: '1. nadstropje',
    nodeId: 101,
    spaceId: 1,
    spaceName: 'Alfa',
    spaceTypeName: 'Classroom',
    description: 'Opis prostora Alfa',
    imageUrl: null,
    hasNode: true,
  },
];

const buildings = [
  {
    id: 1,
    name: 'Objekt G2',
    description: 'Opis objekta G2',
    imageUrl: null,
    spaceCount: 1,
  },
];

const buildingSpaces = [
  {
    id: 1,
    name: 'Alfa',
    type: 'Classroom',
    buildingId: 1,
    buildingName: 'Objekt G2',
    floor: '1. nadstropje',
    description: 'Opis prostora Alfa',
    imageUrl: null,
  },
];

const locations = [
  {
    id: 11,
    displayName: 'Glavni vhod - G2, Pritlicje',
    locationType: 'entrance',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 1,
    floorCode: 'pritlicje',
    floorLabel: 'Pritlicje',
    nodeId: 11,
    spaceId: null,
    spaceName: null,
    spaceTypeName: null,
    description: null,
    imageUrl: null,
    hasNode: true,
  },
  {
    id: 12,
    displayName: 'Alfa - G2, 1. nadstropje',
    locationType: 'classroom',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 10,
    floorCode: '1_nadstropje',
    floorLabel: '1. nadstropje',
    nodeId: 12,
    spaceId: 1,
    spaceName: 'Alfa',
    spaceTypeName: 'Classroom',
    description: 'Opis prostora Alfa',
    imageUrl: null,
    hasNode: true,
  },
];

const routeResponse = {
  routeId: 'route-1',
  from: locations[0],
  to: locations[1],
  totalCost: 10,
  segments: [
    {
      index: 0,
      buildingId: 1,
      buildingCode: 'G2',
      buildingName: 'Objekt G2',
      floorId: 1,
      floorCode: 'pritlicje',
      floorLabel: 'Pritlicje',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1190,
      coordinateHeight: 842,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 11, externalId: 'A', label: 'A', nodeType: 'entrance', x: 10, y: 10, z: 0 },
        { nodeId: 12, externalId: 'B', label: 'B', nodeType: 'room', x: 20, y: 20, z: 0 },
      ],
      steps: [
        { index: 0, text: 'Nastavite prema Alfa.', fromNodeId: 11, toNodeId: 12, type: 'corridor' },
      ],
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/navigation/spaces**', async (route) => {
    await route.fulfill({ json: spaces });
  });

  await page.route('**/api/catalog/buildings', async (route) => {
    await route.fulfill({ json: buildings });
  });

  await page.route('**/api/catalog/buildings/1/spaces', async (route) => {
    await route.fulfill({ json: buildingSpaces });
  });

  await page.route('**/api/navigation/locations**', async (route) => {
    await route.fulfill({ json: locations });
  });

  await page.route('**/api/navigation/route**', async (route) => {
    await route.fulfill({ json: routeResponse });
  });
});

test('home route renders spaces and opens a detail card', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="space-results"]').waitFor();
  await expect(page.getByText('Alfa')).toBeVisible();
  await page.getByText('Alfa').click();
  await expect(page.getByRole('heading', { name: 'Alfa' })).toBeVisible();
});

test('buildings route shows building list and nested space detail flow', async ({ page }) => {
  await page.goto('/objekti');
  await page.locator('[data-testid="building-results"]').waitFor();
  await page.getByText('Objekt G2').click();
  await expect(page.getByText('Prostori v objektu')).toBeVisible();
  await page.getByRole('button', { name: 'Podrobnosti' }).click();
  await expect(page.getByRole('heading', { name: 'Alfa' })).toBeVisible();
});

test('navigation route can calculate a route', async ({ page }) => {
  await page.goto('/navigacija');
  await page.locator('#start-location').fill('Glavni');
  await page.getByText('Glavni vhod - G2, Pritlicje').click();
  await page.locator('#target-location').fill('Alfa');
  await page.getByText('Alfa - G2, 1. nadstropje').click();
  await page.getByTestId('show-route-button').click();
  await expect(page.getByText('Nastavite prema Alfa.')).toBeVisible();
});

test('about route renders static content and top-level refresh works', async ({ page }) => {
  await page.goto('/o-feri');
  await expect(
    page.getByText('Fakulteta za elektrotehniko, računalništvo in informatiko', { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Fakulteta za elektrotehniko, računalništvo in informatiko', { exact: true })
  ).toBeVisible();
});
