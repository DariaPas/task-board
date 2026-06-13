import { expect, test } from '@playwright/test';

test.describe('Task Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display the three columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'To Do' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).click();

    await page.getByLabel('Title').fill('API Endpoint implementieren');
    await page.getByLabel('Description').fill('REST Endpoint for User CRUD');
    await page.locator('form').getByLabel('Priority').selectOption('high')

    await page.getByRole('button', { name: /create|save/i }).click();

    const todoColumn = page.locator('[data-testid="column-todo"]');
    await expect(todoColumn.getByText('API Endpoint implementieren')).toBeVisible();
  });

  test('should move a task from To Do to In Progress', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).click();

    await page.getByLabel('Title').fill('Test Task');
    await page.getByRole('button', { name: /create|save/i }).click();

    const taskCard = page.locator('[data-testid="task-card"]').filter({
      hasText: 'Test Task',
    });

    await taskCard.getByRole('button', { name: /in progress/i }).click();

    const inProgressColumn = page.locator('[data-testid="column-in-progress"]');
    await expect(inProgressColumn.getByText('Test Task')).toBeVisible();
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).click();
    await page.getByLabel('Title').fill('High Priority Task');
    await page.locator('form').getByLabel('Priority').selectOption('high')
    await page.getByRole('button', { name: /create|save/i }).click();

    await page.getByRole('button', { name: /new task/i }).click();
    await page.getByLabel('Title').fill('Low Priority Task');
    await page.locator('form').getByLabel('Priority').selectOption('low')
    await page.getByRole('button', { name: /create|save/i }).click();

    await page.getByLabel(/filter priority/i).selectOption('high');

    await expect(page.getByText('High Priority Task')).toBeVisible();
    await expect(page.getByText('Low Priority Task')).not.toBeVisible();

    const visibleCards = page.locator('[data-testid="task-card"]:visible');

    for (const card of await visibleCards.all()) {
      await expect(card.locator('[data-testid="priority-badge"]')).toHaveText(/high/i);
    }
  });

  test('should persist tasks in localStorage after reload', async ({ page }) => {
    await page.getByRole('button', { name: /new task/i }).click();

    await page.getByLabel('Title').fill('Persistence Test');
    await page.getByRole('button', { name: /create|save/i }).click();

    await page.reload();

    await expect(page.getByText('Persistence Test')).toBeVisible();
  });

  test('should load tasks from the API and display them', async ({ page }) => {
    await page.route('**/dummyjson.com/todos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          todos: [
            { id: 101, todo: 'Mock Task One', completed: false, userId: 1 },
            { id: 102, todo: 'Mock Task Two', completed: true, userId: 1 },
          ],
          total: 2,
          skip: 0,
          limit: 2,
        }),
      });
    });

    await page.goto('/');

    await expect(page.getByText('Mock Task One')).toBeVisible();
    await expect(page.getByText('Mock Task Two')).toBeVisible();

    const doneColumn = page.locator('[data-testid="column-done"]');
    await expect(doneColumn.getByText('Mock Task Two')).toBeVisible();
  });

  test('should show a loading state while the API is loading', async ({ page }) => {
    await page.route('**/dummyjson.com/todos**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          todos: [],
          total: 0,
          skip: 0,
          limit: 0,
        }),
      });
    });

    await page.goto('/');

    await expect(page.getByText(/loading/i)).toBeVisible();
    await expect(page.getByText(/loading/i)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('should handle an API error', async ({ page }) => {
    await page.route('**/dummyjson.com/todos**', async (route) => {
      await route.abort('connectionrefused');
    });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'To Do' })).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();
  });
});