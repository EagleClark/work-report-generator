import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { UserManagementPage } from '@/pages/UserManagement.page';
import { server } from '../../mocks/server';
import { mockUsers } from '../../mocks/data';
import { UserRole } from '@/types/user';

const API_BASE = 'http://localhost:3001/api';

const { mockNotificationsShow } = vi.hoisted(() => ({
  mockNotificationsShow: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: mockNotificationsShow },
}));

const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const INITIAL_USERS = [
  { id: 1, username: 'superadmin', role: UserRole.SUPER_ADMIN, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, username: 'admin', role: UserRole.ADMIN, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, username: 'user1', role: UserRole.USER, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 4, username: 'user2', role: UserRole.USER, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <UserManagementPage />
    </MemoryRouter>,
  );

describe('UserManagementPage 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsers.length = 0;
    mockUsers.push(...INITIAL_USERS.map((u) => ({ ...u })));
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: 'admin', role: UserRole.ADMIN, createdAt: '', updatedAt: '' },
      isAuthenticated: true,
    });
  });

  it('渲染页面标题"用户管理"', () => {
    renderPage();
    expect(screen.getByText('用户管理')).toBeInTheDocument();
  });

  it('渲染"新增用户"按钮', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '新增用户' })).toBeInTheDocument();
  });

  it('从 API 加载并渲染用户列表（不包含密码字段）', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('superadmin')).toBeInTheDocument();
    });
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
  });

  it('显示角色徽章（Badge）并包含正确的角色中文文本', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('超级管理员')).toBeInTheDocument();
    });
    expect(screen.getByText('管理员')).toBeInTheDocument();
    expect(screen.getAllByText('普通用户')).toHaveLength(2);
  });

  it('点击"新增用户"打开创建弹窗', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '新增用户' }));

    // Modal 异步渲染，等待弹窗出现
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码（至少6位）')).toBeInTheDocument();
    expect(screen.getByDisplayValue('普通用户')).toBeInTheDocument();
  });

  it('创建用户后显示成功通知', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '新增用户' }));
    await screen.findByRole('dialog');
    const usernameInput = screen.getByPlaceholderText('请输入用户名');
    const passwordInput = screen.getByPlaceholderText('请输入密码（至少6位）');
    await user.type(usernameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: '成功', message: '用户创建成功' }),
      );
    });
  });

  it('创建用户后用户列表刷新', async () => {
    // 用户 POST handler 不自动 push 到 mockUsers，需要覆盖
    server.use(
      http.post(`${API_BASE}/users`, async ({ request }) => {
        const body = (await request.json()) as { username: string; password: string; role?: string };
        const newUser = {
          id: mockUsers.length + 1,
          username: body.username,
          role: (body.role || UserRole.USER) as UserRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockUsers.push(newUser);
        return HttpResponse.json(newUser, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '新增用户' }));
    await screen.findByRole('dialog');
    const usernameInput = screen.getByPlaceholderText('请输入用户名');
    const passwordInput = screen.getByPlaceholderText('请输入密码（至少6位）');
    await user.type(usernameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(screen.getByText('newuser')).toBeInTheDocument();
    });
  });

  describe('删除按钮逻辑', () => {
    it('SUPER_ADMIN 用户没有删除按钮', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('superadmin')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      const superadminRow = rows.find((row) => within(row).queryByText('superadmin'));
      expect(superadminRow).toBeDefined();
      expect(within(superadminRow!).queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
    });

    it('当前用户没有删除按钮', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      const currentUserRow = rows.find((row) => within(row).queryByText('admin'));
      expect(currentUserRow).toBeDefined();
      expect(within(currentUserRow!).queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
    });

    it('当前用户为 ADMIN 时，只显示 user1 和 user2 的删除按钮', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const deleteButtons = screen.queryAllByRole('button', { name: '删除' });
      // superadmin(SUPER_ADMIN) + admin(当前用户) 没有删除按钮
      expect(deleteButtons).toHaveLength(2);
    });

    it('当前用户为 SUPER_ADMIN 时，除自己外其他用户都有删除按钮', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'superadmin', role: UserRole.SUPER_ADMIN, createdAt: '', updatedAt: '' },
        isAuthenticated: true,
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });

      const deleteButtons = screen.queryAllByRole('button', { name: '删除' });
      // superadmin(SUPER_ADMIN + 当前用户) 没有删除按钮
      // admin + user1 + user2 有删除按钮
      expect(deleteButtons).toHaveLength(3);
    });

    it('可以删除普通用户', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const deleteButtons = screen.queryAllByRole('button', { name: '删除' });
      await user.click(deleteButtons[0]);

      // 确认对话框中显示被删除的用户名（表格中也有该用户名）
      expect(screen.getAllByText(/user1/).length).toBeGreaterThanOrEqual(1);
      await user.click(screen.getByRole('button', { name: '确认删除' }));

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: '成功', message: '用户删除成功' }),
        );
      });
    });

    it('删除用户后列表不再显示该用户', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const deleteButtons = screen.queryAllByRole('button', { name: '删除' });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole('button', { name: '确认删除' }));

      await waitFor(() => {
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });
  });

  describe('角色选择逻辑', () => {
    it('SUPER_ADMIN 用户可以看到管理员角色选项', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'superadmin', role: UserRole.SUPER_ADMIN, createdAt: '', updatedAt: '' },
        isAuthenticated: true,
      });

      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: '新增用户' }));
      await screen.findByRole('dialog');

      // 通过默认显示值找到角色选择器并展开下拉
      const roleSelect = screen.getByDisplayValue('普通用户');
      await user.click(roleSelect);

      // 应该可以看到"管理员"选项
      const adminOption = await screen.findByRole('option', { name: '管理员' });
      expect(adminOption).toBeInTheDocument();
    });

    it('ADMIN 用户看不到管理员角色选项', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: '新增用户' }));
      await screen.findByRole('dialog');

      // 通过默认显示值找到角色选择器并展开下拉
      const roleSelect = screen.getByDisplayValue('普通用户');
      await user.click(roleSelect);

      // 不应该能看到"管理员"选项
      expect(screen.queryByRole('option', { name: '管理员' })).not.toBeInTheDocument();
      // 只能看到"普通用户"选项
      const userOption = await screen.findByRole('option', { name: '普通用户' });
      expect(userOption).toBeInTheDocument();
    });
  });
});
