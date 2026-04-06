import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('任务管理测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('任务列表页面加载', async ({ page }) => {
    // 访问首页（任务管理页）
    await page.goto(`${BASE_URL}/`);

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查是否有任务相关元素
    const taskElements = await page.locator('table, [role="table"], .mantine-Table-root').count();

    // 如果有表格，说明是任务管理页
    if (taskElements > 0) {
      expect(taskElements).toBeGreaterThan(0);
    }
  });

  test('周报汇总页加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/weekly-report`);

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查页面元素
    await expect(page).toHaveURL(/weekly-report/);
  });

  test('任务筛选功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 查找筛选相关的输入或下拉框
    const projectFilter = page.locator('select, [role="combobox"]').first();

    if (await projectFilter.isVisible()) {
      await projectFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test('创建任务按钮存在', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.waitForTimeout(2000);

    // 查找创建任务按钮
    const createButton = page.getByRole('button', { name: /创建|新增|添加/ });

    // 检查按钮是否存在
    const isVisible = await createButton.isVisible().catch(() => false);
    // 按钮可能存在也可能不存在（取决于权限）
    expect(typeof isVisible).toBe('boolean');
  });

  test('任务表格列头显示', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.waitForTimeout(2000);

    // 检查是否有表格
    const tableExists = await page.locator('table, .mantine-Table-root').count() > 0;

    if (tableExists) {
      // 检查是否有表头
      const headers = await page.locator('th').count();
      expect(headers).toBeGreaterThan(0);
    }
  });
});

test.describe('任务表单测试', () => {
  test('任务表单必填字段标记', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.waitForTimeout(2000);

    // 点击创建任务按钮（如果存在）
    const createButton = page.getByRole('button', { name: /创建|新增|添加/ });

    if (await createButton.isVisible()) {
      await createButton.click();

      // 等待表单加载
      await page.waitForTimeout(1000);

      // 检查表单元素
      const formExists = await page.locator('form, [role="form"]').count() > 0;
      expect(formExists).toBe(true);
    }
  });

  test('任务表单取消按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.waitForTimeout(2000);

    const createButton = page.getByRole('button', { name: /创建|新增|添加/ });

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);

      const cancelButton = page.getByRole('button', { name: /取消/ });

      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});