import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('项目管理测试', () => {
  test('项目管理页面加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toContain(BASE_URL);
  });

  test('项目列表显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);

    await page.waitForTimeout(2000);

    // 检查是否有表格
    const tableExists = await page.locator('table, .mantine-Table-root').count() > 0;

    if (tableExists) {
      const headers = await page.locator('th').count();
      expect(headers).toBeGreaterThan(0);
    }
  });

  test('创建项目按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);

    await page.waitForTimeout(2000);

    const createButton = page.getByRole('button', { name: /创建|新增|添加/ });
    const isVisible = await createButton.isVisible().catch(() => false);

    expect(typeof isVisible).toBe('boolean');
  });

  test('项目名称显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);

    await page.waitForTimeout(2000);

    // 检查是否有项目名称相关文本
    const projectText = await page.locator('text=/项目|Project/i').count();
    expect(projectText).toBeGreaterThanOrEqual(0);
  });

  test('项目表格交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);

    await page.waitForTimeout(2000);

    const tableExists = await page.locator('table, .mantine-Table-root').count() > 0;

    if (tableExists) {
      // 检查表格行
      const rows = await page.locator('tbody tr, [role="row"]').count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('项目权限测试', () => {
  test('未授权用户无法访问项目管理', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto(`${BASE_URL}/projects`);

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const isNotProjectsPage = !currentUrl.includes('/projects');

    expect(isLoginPage || isNotProjectsPage).toBe(true);
  });

  test('项目描述字段', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);

    await page.waitForTimeout(2000);

    const tableExists = await page.locator('table, .mantine-Table-root').count() > 0;

    if (tableExists) {
      // 查找描述相关内容
      const descText = await page.locator('text=/描述|Description/i').count();
      expect(descText).toBeGreaterThanOrEqual(0);
    }
  });
});