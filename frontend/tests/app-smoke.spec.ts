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
    spaceTypeName: 'Učilnica',
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
    type: 'Učilnica',
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
    displayName: 'Glavni vhod - G2, Pritličje',
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
    spaceTypeName: 'Učilnica',
    description: 'Opis prostora Alfa',
    imageUrl: null,
    hasNode: true,
  },
  {
    id: 13,
    displayName: 'Glavno stopnišče - G2, 1. nadstropje',
    locationType: 'stairs',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 10,
    floorCode: '1_nadstropje',
    floorLabel: '1. nadstropje',
    nodeId: 13,
    spaceId: null,
    spaceName: null,
    spaceTypeName: null,
    description: null,
    imageUrl: null,
    hasNode: true,
  },
  {
    id: 14,
    displayName: 'WC - G2, 1. nadstropje',
    locationType: 'wc',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 10,
    floorCode: '1_nadstropje',
    floorLabel: '1. nadstropje',
    nodeId: 14,
    spaceId: null,
    spaceName: null,
    spaceTypeName: null,
    description: null,
    imageUrl: null,
    hasNode: true,
  },
  {
    id: 15,
    displayName: 'Avtomat za kavo - E, Pritličje',
    searchableName:
      'avtomat za kavo aparat za kafu coffee vending machine masina za sokove',
    locationType: 'service',
    buildingId: 2,
    buildingCode: 'E',
    buildingName: 'Objekt E',
    floorId: 20,
    floorCode: 'pritlicje',
    floorLabel: 'Pritličje',
    nodeId: 15,
    spaceId: null,
    spaceName: null,
    spaceTypeName: null,
    description: null,
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
      floorLabel: 'Pritličje',
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
        {
          index: 0,
          text: 'Nadaljujte proti Alfa.',
          fromNodeId: 11,
          toNodeId: 12,
          type: 'corridor',
        },
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
    const requestUrl = new URL(route.request().url());
    const locationMatch = requestUrl.pathname.match(/^\/api\/navigation\/locations\/(\d+)$/);

    if (locationMatch) {
      const locationId = Number(locationMatch[1]);
      const location = locations.find((item) => item.id === locationId);

      if (!location) {
        await route.fulfill({
          status: 404,
          json: {
            code: 'LOCATION_NOT_FOUND',
            message: 'Location not found.',
          },
        });
        return;
      }

      await route.fulfill({ json: location });
      return;
    }

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
  await expect(page.getByRole('heading', { name: 'Alfa' }).last()).toBeVisible();
});

test('buildings route shows building list and nested space detail flow', async ({ page }) => {
  await page.goto('/objekti');
  await page.locator('[data-testid="building-results"]').waitFor();
  await page.getByText('Objekt G2').click();
  await expect(page.getByText('Prostori v objektu')).toBeVisible();
  await page.getByText('Alfa').click();
  await expect(page.getByRole('heading', { name: 'Alfa' }).last()).toBeVisible();
});

test('navigation route can calculate a route', async ({ page }) => {
  let requestedAllowElevator: string | null = null;
  await page.route('**/api/navigation/route**', async (route) => {
    requestedAllowElevator = new URL(route.request().url()).searchParams.get('allowElevator');
    await route.fulfill({ json: routeResponse });
  });

  await page.goto('/navigacija');
  await expect(page.locator('#start-location')).toBeVisible();
  await expect(page.locator('#allow-elevator')).toBeChecked();
  await expect(page.getByTestId('show-route-button')).toBeVisible();
  await page.locator('#start-location').fill('Glavni');
  await page.getByRole('button', { name: /Glavni vhod.*G2.*Pritličje/i }).click();
  await page.locator('#target-location').fill('Alfa');
  await page.getByRole('button', { name: /Alfa.*G2.*1\. nadstropje/i }).click();
  await page.getByTestId('show-route-button').click();
  await expect(page.getByText('Nadaljujte proti Alfa.')).toBeVisible();
  await expect(page.getByLabel('Deli pot')).toHaveCount(1);
  await expect(page.getByLabel('Prenesi PDF')).toHaveCount(0);
  expect(requestedAllowElevator).toBe('true');
});

test('navigation route filters stairs and wc from target search and lets user disable lift', async ({
  page,
}) => {
  let requestedAllowElevator: string | null = null;
  await page.route('**/api/navigation/route**', async (route) => {
    requestedAllowElevator = new URL(route.request().url()).searchParams.get('allowElevator');
    await route.fulfill({ json: routeResponse });
  });

  await page.goto('/navigacija');
  await page.locator('#start-location').fill('Glavni');
  await page.getByRole('button', { name: /Glavni vhod.*G2.*Pritličje/i }).click();
  await page.locator('#target-location').fill('G2');
  await expect(page.getByRole('button', { name: /Alfa.*G2.*1\. nadstropje/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Glavno stopnišče.*G2.*1\. nadstropje/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^WC.*G2.*1\. nadstropje/i })).toHaveCount(0);
  await page.getByRole('button', { name: /Alfa.*G2.*1\. nadstropje/i }).click();
  await page.locator('#allow-elevator').uncheck();
  await expect(page.locator('#allow-elevator')).not.toBeChecked();
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Nadaljujte proti Alfa.')).toBeVisible();
  expect(requestedAllowElevator).toBe('false');
});

test('navigation route can calculate the nearest wc route', async ({ page }) => {
  let requestedTargetType: string | null = null;
  let requestedToLocationId: string | null = null;
  await page.route('**/api/navigation/route**', async (route) => {
    const params = new URL(route.request().url()).searchParams;
    requestedTargetType = params.get('targetType');
    requestedToLocationId = params.get('toLocationId');
    await route.fulfill({
      json: {
        ...routeResponse,
        routeId: 'route-11-nearest-wc-14',
        to: locations[3],
        segments: [
          {
            ...routeResponse.segments[0],
            steps: [
              {
                ...routeResponse.segments[0].steps[0],
                text: 'Nadaljujte proti WC.',
                toNodeId: 14,
              },
            ],
          },
        ],
      },
    });
  });

  await page.goto('/navigacija');
  await page.locator('#start-location').fill('Glavni');
  await page.getByRole('button', { name: /Glavni vhod/i }).click();
  await page.locator('#target-location').fill('WC');
  await page.getByRole('button', { name: /Najbli.*WC/i }).click();
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Nadaljujte proti WC.')).toBeVisible();
  expect(requestedTargetType).toBe('wc');
  expect(requestedToLocationId).toBeNull();
});

test('navigation route can search and route to the coffee vending machine', async ({ page }) => {
  let requestedTargetType: string | null = null;
  let requestedToLocationId: string | null = null;
  await page.route('**/api/navigation/route**', async (route) => {
    const params = new URL(route.request().url()).searchParams;
    requestedTargetType = params.get('targetType');
    requestedToLocationId = params.get('toLocationId');
    await route.fulfill({
      json: {
        ...routeResponse,
        routeId: 'route-11-coffee-vending-15',
        to: locations[4],
        segments: [
          {
            ...routeResponse.segments[0],
            steps: [
              {
                ...routeResponse.segments[0].steps[0],
                text: 'Nadaljujte proti avtomatu za kavo.',
                toNodeId: 15,
              },
            ],
          },
        ],
      },
    });
  });

  await page.goto('/navigacija');
  await page.locator('#start-location').fill('Glavni');
  await page.getByRole('button', { name: /Glavni vhod/i }).click();
  await page.locator('#target-location').fill('coffee');
  await page.getByRole('button', { name: /Avtomat za kavo.*E.*Pritličje/i }).click();
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Nadaljujte proti avtomatu za kavo.')).toBeVisible();
  expect(requestedTargetType).toBeNull();
  expect(requestedToLocationId).toBe('15');
});

test('coffee vending machine is displayed in English after language switch', async ({ page }) => {
  await page.goto('/navigacija');
  await page.getByRole('button', { name: 'Jezik' }).click();
  await page.locator('#target-location').fill('coffee');

  await expect(
    page.getByRole('button', {
      name: /Coffee vending machine.*E.*Ground Floor/i,
    })
  ).toBeVisible();
});

test('home page can prefill navigation target from a space card action', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="space-results"]').waitFor();
  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();
  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});

test('home start-location link prefills start after destination selection', async ({ page }) => {
  await page.goto('/?fromLocationId=11');
  await page.locator('[data-testid="space-results"]').waitFor();

  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();

  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#start-location')).toHaveValue(/Glavni vhod/);
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});

test('home start-location link survives opening destination details', async ({ page }) => {
  await page.goto('/?fromLocationId=11');
  await page.locator('[data-testid="space-results"]').waitFor();

  await page.getByText('Alfa').click();
  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();

  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#start-location')).toHaveValue(/Glavni vhod/);
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});

test('invalid home start-location link is ignored', async ({ page }) => {
  await page.goto('/?fromLocationId=999');
  await page.locator('[data-testid="space-results"]').waitFor();

  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();

  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#start-location')).toHaveValue('');
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});

test('buildings page can prefill navigation target from building space action', async ({
  page,
}) => {
  await page.goto('/objekti');
  await page.locator('[data-testid="building-results"]').waitFor();
  await page.getByText('Objekt G2').click();
  await page.getByText('Alfa').click();
  await page.getByRole('button', { name: /Poi.*ilnico/i }).click();
  await expect(page).toHaveURL(/\/navigacija$/);
  await expect(page.locator('#target-location')).toHaveValue('Alfa');
});

test('navigation route shows backend error message when route lookup fails', async ({ page }) => {
  await page.route('**/api/navigation/route**', async (route) => {
    await route.fulfill({
      status: 404,
      json: {
        code: 'NO_ROUTE',
        message: 'Za izbrani lokaciji še ni vnesene poti.',
      },
    });
  });

  await page.goto('/navigacija');
  await page.locator('#start-location').fill('Glavni');
  await page.getByRole('button', { name: /Glavni vhod.*G2.*Pritličje/i }).click();
  await page.locator('#target-location').fill('Alfa');
  await page.getByRole('button', { name: /Alfa.*G2.*1\. nadstropje/i }).click();
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Za izbrani lokaciji še ni vnesene poti.')).toBeVisible();
});

test('navigation route renders shell and top-level refresh works', async ({ page }) => {
  await page.goto('/navigacija');
  await expect(page.locator('#start-location')).toBeVisible();
  await page.reload();
  await expect(page.locator('#start-location')).toBeVisible();
});

test('language switch defaults to sl, switches to en, and persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.removeItem('feri.navigator.language');
  });
  await page.reload();
  await expect(page.locator('#space-search')).toHaveAttribute(
    'placeholder',
    /Išči|I.*či učilnico/i
  );

  await page.getByLabel(/Odpri meni/i).click();
  await page.getByRole('button', { name: 'English' }).click();

  await expect(page.locator('#space-search')).toHaveAttribute(
    'placeholder',
    /Search for a classroom, laboratory, or office/i
  );

  await page.reload();
  await expect(page.locator('#space-search')).toHaveAttribute(
    'placeholder',
    /Search for a classroom, laboratory, or office/i
  );
});
