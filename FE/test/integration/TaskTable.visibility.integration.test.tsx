import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { TaskTable } from '@/components/TaskTable/TaskTable';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider env="test">
    <MemoryRouter>{children}</MemoryRouter>
  </MantineProvider>
);

vi.mock('@/services/task.api', () => ({
  taskApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/services/user.api', () => ({
  userApi: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/services/project.api', () => ({
  projectApi: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'admin', role: 'ADMIN' }, hasRole: () => true, isAuthenticated: true, isLoading: false, login: vi.fn(), guestLogin: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/context/WeekContext', () => ({
  useWeek: () => ({ year: 2026, weekNumber: 21, setYear: vi.fn(), setWeekNumber: vi.fn() }),
  WeekProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('TaskTable 列配置隐藏集成测试', () => {
  it('渲染齿轮图标按钮', () => {
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    );
    expect(gearButton).toBeDefined();
  });

  it('点击齿轮图标弹出 Popover 包含列 Checkbox', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    expect(screen.getByRole('checkbox', { name: /项目/ })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: /US\/DTS/ })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: /操作/ })).toBeDefined();
  });

  it('取消勾选某列后该列从表头移除', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    const usDtsCheckbox = screen.getByRole('checkbox', { name: /US\/DTS/ });
    await user.click(usDtsCheckbox);

    // 关闭 popover
    await user.click(gearButton);

    // US/DTS 列头不应存在
    expect(screen.queryByText('US/DTS')).toBeNull();
  });

  it('点击"全选"按钮恢复所有列', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    // 先隐藏两列
    await user.click(screen.getByRole('checkbox', { name: /项目/ }));
    await user.click(screen.getByRole('checkbox', { name: /US\/DTS/ }));

    // 点击"全选"
    await user.click(screen.getByRole('button', { name: /全选/ }));

    // 关闭 popover
    await user.click(gearButton);

    // 所有列头应重新出现
    expect(screen.getByText('US/DTS')).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /项目/ })).toBeDefined();
  });

  it('点击"最少"按钮仅保留第一列', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    await user.click(screen.getByRole('button', { name: /最少/ }));
    await user.click(gearButton);

    // 只有"项目"在表头中（第一列之后的列应该隐藏）
    expect(screen.getByRole('columnheader', { name: /项目/ })).toBeDefined();
    expect(screen.queryByText('US/DTS')).toBeNull();
  });

  it('最后一列可见时其 Checkbox 被 disabled', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    // 点击"最少"只留第一列
    await user.click(screen.getByRole('button', { name: /最少/ }));

    // "项目"checkbox 应被 disabled（它是唯一的可见列）
    const projectCheckbox = screen.getByRole('checkbox', { name: /项目/ });
    expect(projectCheckbox).toBeDisabled();
  });

  it('重新勾选已隐藏的列使其恢复', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const gearButton = buttons.find(btn =>
      btn.querySelector('svg')
    )!;
    await user.click(gearButton);

    // 隐藏 US/DTS
    const usDtsCheckbox = screen.getByRole('checkbox', { name: /US\/DTS/ });
    await user.click(usDtsCheckbox);
    expect(usDtsCheckbox).not.toBeChecked();

    // 重新勾选
    await user.click(usDtsCheckbox);
    expect(usDtsCheckbox).toBeChecked();

    await user.click(gearButton);
    expect(screen.getByText('US/DTS')).toBeDefined();
  });
});
