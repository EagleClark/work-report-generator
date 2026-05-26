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
});
