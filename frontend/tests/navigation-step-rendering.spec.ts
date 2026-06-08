import { expect, test, type Page } from '@playwright/test';
import type { NavigationRoute } from '../src/types/navigation';
import {
  bentGroupedRoute,
  crossFloorEntryRoute,
  repeatedNodeRoute,
  routeGeometryLocations,
  sharedBoundaryRoute,
  straightGroupedRoute,
} from './fixtures/routeStepGeometryFixtures';

async function mockNavigationRoute(page: Page, routeResponse: NavigationRoute) {
  await page.route('**/api/navigation/locations**', async (route) => {
    await route.fulfill({ json: routeGeometryLocations });
  });

  await page.route('**/api/navigation/route**', async (route) => {
    await route.fulfill({ json: routeResponse });
  });
}

async function selectLocation(page: Page, inputSelector: string, query: string, optionName: RegExp) {
  await page.locator(inputSelector).fill(query);
  await page.getByRole('button', { name: optionName }).click();
}

test('renders only the direct active line for a geometrically straight grouped step', async ({
  page,
}) => {
  await mockNavigationRoute(page, straightGroupedRoute);
  await page.goto('/navigacija');

  await selectLocation(page, '#start-location', 'Start - TEST, Floor 1', /^Start TEST - Floor 1$/i);
  await selectLocation(page, '#target-location', 'End - TEST, Floor 1', /^End TEST - Floor 1$/i);
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Nadaljujte po hodniku.')).toBeVisible();
  await expect(page.getByTestId('active-step-direct-line')).toHaveCount(1);
  await expect(page.getByTestId('active-step-polyline')).toHaveCount(0);
});

test('renders only the waypoint-following active polyline for a bent grouped step', async ({
  page,
}) => {
  await mockNavigationRoute(page, bentGroupedRoute);
  await page.goto('/navigacija');

  await selectLocation(page, '#start-location', 'Start - TEST, Floor 2', /^Start TEST - Floor 2$/i);
  await selectLocation(page, '#target-location', 'End - TEST, Floor 2', /^End TEST - Floor 2$/i);
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Nadaljujte po hodniku.')).toBeVisible();
  await expect(page.getByTestId('active-step-direct-line')).toHaveCount(0);
  await expect(page.getByTestId('active-step-polyline')).toHaveCount(1);

  const points = await page.getByTestId('active-step-polyline').getAttribute('points');
  expect(points?.trim().split(/\s+/).length).toBeGreaterThan(2);
});

test('resolves the active step span correctly when the segment path revisits the same node id', async ({
  page,
}) => {
  await mockNavigationRoute(page, repeatedNodeRoute);
  await page.goto('/navigacija');

  await selectLocation(page, '#start-location', 'Repeat Start - TEST, Floor 3', /^Repeat Start TEST - Floor 3$/i);
  await selectLocation(page, '#target-location', 'Repeat End - TEST, Floor 3', /^Repeat End TEST - Floor 3$/i);
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Pojdite do notranjega hodnika.')).toBeVisible();
  await page.getByRole('button', { name: 'Naprej' }).click();
  await expect(page.getByText('Nadaljujte do cilja.')).toBeVisible();

  const directLine = page.getByTestId('active-step-direct-line');
  await expect(directLine).toHaveCount(1);
  await expect(page.getByTestId('active-step-polyline')).toHaveCount(0);
  await expect(directLine).toHaveAttribute('x1', '420');
  await expect(directLine).toHaveAttribute('x2', '520');
});

test('keeps the shared step boundary when consecutive steps meet on the same node', async ({
  page,
}) => {
  await mockNavigationRoute(page, sharedBoundaryRoute);
  await page.goto('/navigacija');

  await selectLocation(page, '#start-location', 'Shared Start - TEST, Floor 4', /^Shared Start TEST - Floor 4$/i);
  await selectLocation(page, '#target-location', 'Shared End - TEST, Floor 4', /^Shared End TEST - Floor 4$/i);
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Pridite do raskrsnice.')).toBeVisible();
  await page.getByRole('button', { name: 'Naprej' }).click();
  await expect(page.getByText('Nastavite do cilja.')).toBeVisible();

  const directLine = page.getByTestId('active-step-direct-line');
  await expect(directLine).toHaveCount(1);
  await expect(page.getByTestId('active-step-polyline')).toHaveCount(0);
  await expect(directLine).toHaveAttribute('x1', '240');
  await expect(directLine).toHaveAttribute('x2', '340');
});

test('renders the active line for the first step after switching to the next floor', async ({
  page,
}) => {
  await mockNavigationRoute(page, crossFloorEntryRoute);
  await page.goto('/navigacija');

  await selectLocation(page, '#start-location', 'Multi Start - TEST, Floor 2', /^Multi Start TEST - Floor 2$/i);
  await selectLocation(page, '#target-location', 'Multi End - TEST, Floor 3', /^Multi End TEST - Floor 3$/i);
  await page.getByTestId('show-route-button').click();

  await expect(page.getByText('Krenite do stepenista.')).toBeVisible();
  await page.getByRole('button', { name: 'Naprej' }).click();
  await expect(page.getByText('Izadjite sa stepenista i nastavite po hodniku.')).toBeVisible();

  await expect(page.getByTestId('active-step-polyline')).toHaveCount(0);
  await expect(page.getByTestId('active-step-direct-line')).toHaveCount(1);
  await expect(page.getByTestId('active-step-direct-line')).toHaveAttribute('x1', '360');
  await expect(page.getByTestId('active-step-direct-line')).toHaveAttribute('x2', '430');
});
