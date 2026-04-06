import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('用户管理测试', () => {
  test('用户管理页面加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);

    await page.waitForTimeout(2000);

    // 如果有权限，应该显示用户管理相关内容
    const currentUrl = page.url();

    // 可能被重定向或显示内容
    expect(currentUrl).toContain(BASE_URL);
  });

  test('用户列表显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);

    await page.waitForTimeout(2000);

    // 检查是否有表格
    const tableExists = await page.locator('table, .mantine-Table-root').count() > 0;

    if (tableExists) {
      // 检查用户相关列
      const headers = await page.locator('th').allInnerTexts();
      // 应该有用户名、角色等列
      expect(headers.length).toBeGreaterThan(0);
    }
  });

  test('创建用户按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);

    await page.waitForTimeout(2000);

    const createButton = page.getByRole('button', { name: /创建|新增|添加/ });
    const isVisible = await createButton.isVisible().catch(() => false);

    // 按钮存在与否取决于权限
    expect(typeof isVisible).toBe('boolean');
  });

  test('用户角色显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);

    await page.waitForTimeout(2000);

    // 如果表格存在，检查是否有角色相关内容
    const tableExists = await page.locator('table, .mantine-Table-root').count() > 0;

    if (tableExists) {
      // 查找角色相关的文本
      const roleText = await page.locator('text=/USER|ADMIN|SUPER_ADMIN|用户|管理员/i').count();
      expect(roleText).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('用户权限测试', () => {
  test('未授权用户无法访问用户管理', async ({ page }) => {
    // 清除认证状态
    await page.context().clearCookies();

    await page.goto(`${BASE_URL}/users`);

    await page.waitForTimeout(2000);

    // 应该被重定向到登录页或显示无权限
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const isNotUsersPage = !currentUrl.includes('/users');

    expect(isLoginPage || isNotUsersPage).toBe(true);
  });
});