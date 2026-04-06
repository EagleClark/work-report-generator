import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Router } from '@/Router';
import { UserRole, type User } from '@/types/user';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock 页面组件
vi.mock('@/pages/LoginPage.page', () => ({
  LoginPage: () => <div data-testid="login-page">登录页</div>,
}));

vi.mock('@/pages/Home.page', () => ({
  HomePage: () => <div data-testid="home-page">首页</div>,
}));

vi.mock('@/pages/WeeklyReport.page', () => ({
  WeeklyReportPage: () => <div data-testid="weekly-report-page">周报汇总页</div>,
}));

vi.mock('@/pages/UserManagement.page', () => ({
  UserManagementPage: () => <div data-testid="user-management-page">用户管理页</div>,
}));

vi.mock('@/pages/ProjectManagement.page', () => ({
  ProjectManagementPage: () => <div data-testid="project-management-page">项目管理页</div>,
}));

// 测试wrapper
const renderWithRouter = (initialRoute: string) => {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Router />
      </MemoryRouter>
    </MantineProvider>
  );
};

describe('Router 路由集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('公开路由', () => {
    it('未登录用户可以访问登录页', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      renderWithRouter('/login');

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('未登录用户可以访问周报汇总页', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      renderWithRouter('/weekly-report');

      expect(screen.getByTestId('weekly-report-page')).toBeInTheDocument();
    });
  });

  describe('受保护路由 - 普通用户权限', () => {
    const userUser: User = {
      id: 2,
      username: 'user1',
      role: UserRole.USER,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('普通用户可以访问首页', () => {
      mockUseAuth.mockReturnValue({
        user: userUser,
        isLoading: false,
      });

      renderWithRouter('/');

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('普通用户无法访问用户管理页', () => {
      mockUseAuth.mockReturnValue({
        user: userUser,
        isLoading: false,
      });

      renderWithRouter('/users');

      // 应该被重定向，不显示用户管理页
      expect(screen.queryByTestId('user-management-page')).not.toBeInTheDocument();
    });

    it('普通用户无法访问项目管理页', () => {
      mockUseAuth.mockReturnValue({
        user: userUser,
        isLoading: false,
      });

      renderWithRouter('/projects');

      // 应该被重定向，不显示项目管理页
      expect(screen.queryByTestId('project-management-page')).not.toBeInTheDocument();
    });
  });

  describe('受保护路由 - 管理员权限', () => {
    const adminUser: User = {
      id: 1,
      username: 'admin',
      role: UserRole.ADMIN,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('管理员可以访问首页', () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isLoading: false,
      });

      renderWithRouter('/');

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('管理员可以访问用户管理页', () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isLoading: false,
      });

      renderWithRouter('/users');

      expect(screen.getByTestId('user-management-page')).toBeInTheDocument();
    });

    it('管理员可以访问项目管理页', () => {
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isLoading: false,
      });

      renderWithRouter('/projects');

      expect(screen.getByTestId('project-management-page')).toBeInTheDocument();
    });
  });

  describe('受保护路由 - 超级管理员权限', () => {
    const superAdminUser: User = {
      id: 1,
      username: 'superadmin',
      role: UserRole.SUPER_ADMIN,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('超级管理员可以访问所有页面', () => {
      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        isLoading: false,
      });

      renderWithRouter('/');

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('超级管理员可以访问用户管理页', () => {
      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        isLoading: false,
      });

      renderWithRouter('/users');

      expect(screen.getByTestId('user-management-page')).toBeInTheDocument();
    });

    it('超级管理员可以访问项目管理页', () => {
      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        isLoading: false,
      });

      renderWithRouter('/projects');

      expect(screen.getByTestId('project-management-page')).toBeInTheDocument();
    });
  });

  describe('游客用户权限', () => {
    const guestUser: User = {
      id: 0,
      username: '游客',
      role: UserRole.GUEST,
      createdAt: '',
      updatedAt: '',
    };

    it('游客无法访问首页', () => {
      mockUseAuth.mockReturnValue({
        user: guestUser,
        isLoading: false,
      });

      renderWithRouter('/');

      // 游客应该被重定向到登录页
      expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    });

    it('游客可以访问周报汇总页', () => {
      mockUseAuth.mockReturnValue({
        user: guestUser,
        isLoading: false,
      });

      renderWithRouter('/weekly-report');

      expect(screen.getByTestId('weekly-report-page')).toBeInTheDocument();
    });
  });

  describe('未认证用户访问控制', () => {
    it('未登录用户访问首页时重定向到登录页', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      renderWithRouter('/');

      // 未登录用户应该被重定向
      expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    });

    it('未登录用户访问用户管理页时重定向', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });

      renderWithRouter('/users');

      expect(screen.queryByTestId('user-management-page')).not.toBeInTheDocument();
    });
  });

  describe('加载状态', () => {
    it('加载中时不渲染任何页面内容', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      renderWithRouter('/');

      // 加载中时不应该显示任何页面
      expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
  });

  describe('路由重定向', () => {
    it('未知路由重定向到首页', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'admin', role: UserRole.ADMIN, createdAt: '', updatedAt: '' },
        isLoading: false,
      });

      renderWithRouter('/unknown-route');

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });
});