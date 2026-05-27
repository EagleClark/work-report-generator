import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@test-utils';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '@/pages/Home.page';
import { UserRole } from '@/types/user';

const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/context/WeekContext', () => ({
  useWeek: () => ({ year: 2024, weekNumber: 1, setYear: vi.fn(), setWeekNumber: vi.fn() }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染页面标题"任务管理系统"', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', role: UserRole.ADMIN, createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      hasRole: () => true,
    });
    renderPage();
    expect(screen.getByText('任务管理系统')).toBeInTheDocument();
  });

  it('渲染页面描述"管理和查看每周任务"', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', role: UserRole.ADMIN, createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      hasRole: () => true,
    });
    renderPage();
    expect(screen.getByText('管理和查看每周任务')).toBeInTheDocument();
  });

  it('渲染 TaskTable 组件（包含表格列头）', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 3, username: 'user1', role: UserRole.USER, createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      hasRole: () => false,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('US/DTS')).toBeInTheDocument();
    });
    expect(screen.getByText('任务详情')).toBeInTheDocument();
    expect(screen.getByText('进度')).toBeInTheDocument();
  });

  it('GUEST 用户页面也正常渲染', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 0, username: '游客', role: UserRole.GUEST, createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      hasRole: () => false,
    });
    renderPage();
    expect(screen.getByText('任务管理系统')).toBeInTheDocument();
    expect(screen.getByText('管理和查看每周任务')).toBeInTheDocument();
  });
});
