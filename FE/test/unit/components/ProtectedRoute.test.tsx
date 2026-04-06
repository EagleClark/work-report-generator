import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { UserRole } from '@/types/user';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const TestChild = () => <div>测试内容</div>;

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    </MemoryRouter>
  );
};

describe('ProtectedRoute 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('加载状态测试', () => {
    it('加载中时返回null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { container } = renderWithRouter();
      // Mantine会渲染style标签，但不会渲染子组件
      expect(screen.queryByText('测试内容')).not.toBeInTheDocument();
    });
  });

  describe('未认证用户测试', () => {
    it('未登录且需要认证时重定向到登录页', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAuth={true}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // 由于Navigate组件不会渲染children，所以不应显示测试内容
      expect(screen.queryByText('测试内容')).not.toBeInTheDocument();
    });

    it('未登录但不需要认证时正常渲染内容', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requireAuth={false}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });
  });

  describe('已认证用户测试', () => {
    it('已登录且没有角色限制时正常渲染内容', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'user1', role: UserRole.USER, createdAt: '', updatedAt: '' },
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    it('用户角色在允许列表中时正常渲染内容', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'admin', role: UserRole.ADMIN, createdAt: '', updatedAt: '' },
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    it('用户角色不在允许列表中时重定向到周报页', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'user1', role: UserRole.USER, createdAt: '', updatedAt: '' },
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // 由于Navigate组件不会渲染children，所以不应显示测试内容
      expect(screen.queryByText('测试内容')).not.toBeInTheDocument();
    });

    it('超级管理员可以访问管理员页面', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'superadmin', role: UserRole.SUPER_ADMIN, createdAt: '', updatedAt: '' },
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    it('普通用户无法访问管理员页面', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'user1', role: UserRole.USER, createdAt: '', updatedAt: '' },
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('测试内容')).not.toBeInTheDocument();
    });
  });

  describe('默认参数测试', () => {
    it('默认requireAuth为true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // 未登录用户应该被重定向
      expect(screen.queryByText('测试内容')).not.toBeInTheDocument();
    });

    it('默认allowedRoles为undefined时不检查角色', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'user1', role: UserRole.USER, createdAt: '', updatedAt: '' },
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });
  });
});