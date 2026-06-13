import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const locations = [
  {
    id: 11,
    displayName: 'Vhod Prežihova ulica - G2, Pritličje',
    locationType: 'entrance',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 1,
    floorCode: 'pritlicje',
    floorLabel: 'Pritličje',
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
    displayName: 'G2 P1 Alfa',
    locationType: 'classroom',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 1,
    floorCode: 'pritlicje',
    floorLabel: 'Pritličje',
    nodeId: 12,
    spaceId: 1,
    spaceName: 'Alfa',
    spaceTypeName: 'Učilnica',
    description: null,
    imageUrl: null,
    hasNode: true,
  },
];

const routeResponse = {
  routeId: 'mobile-map-layout',
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
      floorLabel: 'Pritličje',
      mapImageUrl: '/maps/1_pritlicje.png',
      coordinateWidth: 1190,
      coordinateHeight: 842,
      z: 0,
      usesElevator: false,
      usesStairs: false,
      path: [
        { nodeId: 11, externalId: 'A', label: 'A', nodeType: 'entrance', x: 250, y: 650, z: 0 },
        {
          nodeId: 13,
          externalId: 'MID',
          label: '',
          nodeType: 'waypoint',
          x: 285,
          y: 575,
          z: 0,
        },
        { nodeId: 12, externalId: 'B', label: 'B', nodeType: 'room', x: 320, y: 500, z: 0 },
      ],
      steps: [
        {
          index: 0,
          text: 'Nadaljujte po hodniku.',
          fromNodeId: 11,
          toNodeId: 13,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
        {
          index: 1,
          text: 'Nadaljujte do cilja.',
          fromNodeId: 13,
          toNodeId: 12,
          type: 'corridor',
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};

async function selectLocation(page: Page, selector: string, query: string, option: RegExp) {
  await page.locator(selector).fill(query);
  await page.getByRole('button', { name: option }).click();
}

test('keeps the cropped G2 map fitted to an iPhone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/maps/1_pritlicje.png', async (route) => {
    await route.fulfill({
      contentType: 'image/png',
      body: await readFile(new URL('../public/maps/1_pritlicje.png', import.meta.url)),
    });
  });
  await page.route('**/api/navigation/locations**', async (route) => {
    await route.fulfill({ json: locations });
  });
  await page.route('**/api/navigation/route**', async (route) => {
    await route.fulfill({ json: routeResponse });
  });

  await page.goto('/navigacija');
  await selectLocation(page, '#start-location', 'Vhod', /Vhod Prežihova ulica/i);
  await selectLocation(page, '#target-location', 'Alfa', /Alfa G2/i);
  await page.getByTestId('show-route-button').click();

  const mapImage = page.getByRole('img', { name: 'Objekt G2 Pritličje' });
  const mapViewport = mapImage.locator('..');
  await expect(mapImage).toBeVisible();

  const viewportBox = await mapViewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  expect(viewportBox!.width / viewportBox!.height).toBeCloseTo(3960 / 2650, 1);

  const imageBox = await mapImage.boundingBox();
  expect(imageBox).not.toBeNull();
  expect(imageBox!.width).toBeGreaterThan(viewportBox!.width);
  expect(imageBox!.height).toBeGreaterThan(viewportBox!.height);
  expect(imageBox!.x - viewportBox!.x).toBeCloseTo(-(220 / 3960) * viewportBox!.width, 0);
  expect(imageBox!.y).toBeCloseTo(viewportBox!.y, 0);

  const nextButtonBox = await page.getByRole('button', { name: 'Naprej' }).boundingBox();
  expect(nextButtonBox).not.toBeNull();
  expect(nextButtonBox!.y + nextButtonBox!.height).toBeGreaterThanOrEqual(824);
  expect(nextButtonBox!.y + nextButtonBox!.height).toBeLessThanOrEqual(838);
});
