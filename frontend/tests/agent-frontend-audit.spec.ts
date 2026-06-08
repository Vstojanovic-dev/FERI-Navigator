import { expect, test, type Page, type Route } from '@playwright/test';

const tinySvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <rect width="8" height="8" fill="#e7dccb" />
  </svg>
`;

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
    spaceTypeName: 'classroom',
    description: 'Opis prostora Alfa',
    imageUrl: '/maps/space-alfa.png',
    hasNode: true,
  },
  {
    id: 2,
    displayName: 'Beta Lab - G2, 2. nadstropje',
    locationType: 'laboratory',
    buildingId: 1,
    buildingCode: 'G2',
    buildingName: 'Objekt G2',
    floorId: 20,
    floorCode: '2_nadstropje',
    floorLabel: '2. nadstropje',
    nodeId: 102,
    spaceId: 2,
    spaceName: 'Beta Lab',
    spaceTypeName: 'laboratory',
    description: 'Laboratorij Beta',
    imageUrl: '/maps/space-beta.png',
    hasNode: true,
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
  ...spaces,
];

const buildings = [
  {
    id: 1,
    name: 'Objekt G2',
    description: 'Glavni objekt',
    imageUrl: '/maps/building-g2.png',
    spaceCount: 2,
  },
  {
    id: 2,
    name: 'Objekt G3',
    description: 'Drugi objekt',
    imageUrl: '/maps/building-g3.png',
    spaceCount: 1,
  },
];

const buildingSpaces = [
  {
    id: 1,
    name: 'Alfa',
    type: 'classroom',
    buildingId: 1,
    buildingName: 'Objekt G2',
    floor: '1. nadstropje',
    description: 'Opis prostora Alfa',
    imageUrl: null,
    code: 'A-101',
  },
  {
    id: 2,
    name: 'Beta Lab',
    type: 'laboratory',
    buildingId: 1,
    buildingName: 'Objekt G2',
    floor: '2. nadstropje',
    description: 'Laboratorij Beta',
    imageUrl: null,
    code: 'B-201',
  },
];

const routeResponse = {
  routeId: 'route-agent-audit',
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
          icon: 'straight',
          maneuverType: 'straight',
          zoneId: null,
        },
      ],
    },
  ],
};

type AuditState = {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
  serverErrors: string[];
};

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installFrontendAuditMocks(page: Page) {
  await page.route('**/maps/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: tinySvg,
    });
  });

  await page.route('**/images/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: tinySvg,
    });
  });

  await page.route('**/api/catalog/buildings', async (route) => {
    await fulfillJson(route, buildings);
  });

  await page.route('**/api/catalog/buildings/1/spaces', async (route) => {
    await fulfillJson(route, buildingSpaces);
  });

  await page.route('**/api/catalog/buildings/*/spaces', async (route) => {
    await fulfillJson(route, []);
  });

  await page.route('**/api/navigation/spaces**', async (route) => {
    await fulfillJson(route, spaces);
  });

  await page.route('**/api/navigation/locations**', async (route) => {
    await fulfillJson(route, locations);
  });

  await page.route('**/api/navigation/locations/*', async (route) => {
    await fulfillJson(route, spaces[0]);
  });

  await page.route('**/api/navigation/route**', async (route) => {
    await fulfillJson(route, routeResponse);
  });

  await page.route('**/api/navigation/share', async (route) => {
    await fulfillJson(route, {
      shareCode: 'agent123',
      shareUrl: 'http://127.0.0.1:4273/share/agent123',
    });
  });

  await page.route('**/api/navigation/share/*', async (route) => {
    await fulfillJson(route, {
      fromLocationId: 11,
      toLocationId: 1,
      targetType: null,
      allowElevator: true,
    });
  });
}

function createAuditState(page: Page): AuditState {
  const state: AuditState = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    serverErrors: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      state.consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    state.pageErrors.push(error.message);
  });

  page.on('requestfailed', (request) => {
    state.requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown failure'}`);
  });

  page.on('response', (response) => {
    if (response.status() >= 500) {
      state.serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  return state;
}

async function settlePage(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(120);
}

async function openMenuIfPresent(page: Page) {
  const menuButton = page
    .locator('button[aria-label="Odpri meni"], button[aria-label="Open menu"]')
    .first();

  if ((await menuButton.count()) > 0) {
    await menuButton.click();
    await page.waitForTimeout(80);
    await page.locator('div[role="presentation"]').first().click({ position: { x: 8, y: 8 } });
    await page.waitForTimeout(100);
  }
}

async function clickIfPresent(page: Page, selector: string) {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) {
    return;
  }

  await locator.click();
  await page.waitForTimeout(100);
}

async function auditHomeFlow(page: Page) {
  await page.goto('/');
  await settlePage(page);
  await openMenuIfPresent(page);
  await clickIfPresent(page, '[data-testid="space-results"] article');
  await settlePage(page);
  await clickIfPresent(page, 'button[aria-label="Nazaj"], button[aria-label="Back"]');
  await settlePage(page);
}

async function auditBuildingsFlow(page: Page) {
  await page.goto('/objekti');
  await settlePage(page);
  await clickIfPresent(page, '[data-testid="building-results"] article');
  await settlePage(page);
  await clickIfPresent(page, '.spaceCardsList article');
  await settlePage(page);
  await clickIfPresent(page, 'button[aria-label="Nazaj"], button[aria-label="Back"]');
  await settlePage(page);
}

async function selectSuggestion(page: Page, inputSelector: string, query: string) {
  const input = page.locator(inputSelector);
  if ((await input.count()) === 0) {
    return;
  }

  await input.fill(query);
  await page.waitForTimeout(120);
  const suggestion = page.locator('div[class*="resultsBox"] button').first();
  if ((await suggestion.count()) > 0) {
    await suggestion.click();
    await page.waitForTimeout(120);
  }
}

async function auditNavigationFlow(page: Page) {
  await page.goto('/navigacija');
  await settlePage(page);
  await page.locator('#start-location').fill('Glavni');
  await page.locator('#target-location').fill('Alfa');
  await page.waitForTimeout(120);
  await page.keyboard.press('Escape');
  await settlePage(page);
}

function assertNoFrontendErrors(state: AuditState) {
  const failures = [
    ...state.pageErrors.map((item) => `pageerror: ${item}`),
    ...state.consoleErrors.map((item) => `console.error: ${item}`),
    ...state.requestFailures.map((item) => `requestfailed: ${item}`),
    ...state.serverErrors.map((item) => `server error: ${item}`),
  ];

  expect(
    failures,
    failures.length === 0 ? 'Frontend audit passed without runtime/network errors.' : failures.join('\n')
  ).toEqual([]);
}

test('agent frontend audit walks main flows and reports runtime issues', async ({ page }) => {
  await installFrontendAuditMocks(page);
  const auditState = createAuditState(page);

  await auditHomeFlow(page);
  await auditBuildingsFlow(page);
  await auditNavigationFlow(page);

  assertNoFrontendErrors(auditState);
});
