import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { TaskTable } from '@/components/TaskTable/TaskTable';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </MantineProvider>
);

// Mock all external dependencies that TaskTable imports
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

describe('TaskTable 列宽拖动集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染所有 13 列表头，每列含 resizeHandle', () => {
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const thElements = screen.getAllByRole('columnheader');
    expect(thElements).toHaveLength(13);

    thElements.forEach(th => {
      const divs = th.querySelectorAll('div');
      const hasResizeHandle = Array.from(divs).some(div => div.style.cursor === 'col-resize');
      expect(hasResizeHandle).toBe(true);
    });
  });

  it('拖动列宽后宽度发生变化', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TaskTable />
      </TestWrapper>
    );

    const projectTh = screen.getAllByRole('columnheader')[0];
    const allDivs = projectTh.querySelectorAll('div');
    const handle = Array.from(allDivs).find(div => div.style.cursor === 'col-resize')!;
    expect(handle).toBeDefined();
    const initialWidth = projectTh.style.width;

    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
      { target: handle, coords: { x: 50, y: 0 } },
      { keys: '[/MouseLeft]' },
    ]);

    const newWidth = projectTh.style.width;
    expect(newWidth).not.toBe(initialWidth);
  });
});
