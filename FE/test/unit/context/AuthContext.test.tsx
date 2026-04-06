import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/user';
import type { User } from '@/types/user';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

// Mock authApi
vi.mock('@/services/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/services/auth.api';

// 测试组件
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, guestLogin, logout, hasRole } = useAuth();

  return (
    <div>
      <span data-testid="loading">{isLoading.toString()}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="username">{user?.username || 'null'}</span>
      <span data-testid="role">{user?.role || 'null'}</span>
      <button onClick={() => login('admin', 'password')}>登录</button>
      <button onClick={guestLogin}>游客登录</button>
      <button onClick={logout}>登出</button>
      <span data-testid="hasAdmin">{hasRole([UserRole.ADMIN]).toString()}</span>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('初始化测试', () => {
    it('localStorage为空时，用户状态为null', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('username').textContent).toBe('null');
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    it('localStorage有有效token时，恢复用户状态', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        role: UserRole.ADMIN,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      // 设置未过期的token
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      vi.mocked(jwtDecode).mockReturnValue({ exp: futureExp } as any);
      localStorage.setItem('token', 'valid-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('username').textContent).toBe('admin');
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    it('localStorage有过期token时，清除token和user', async () => {
      // 设置已过期的token
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      vi.mocked(jwtDecode).mockReturnValue({ exp: pastExp } as any);
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin' }));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('username').textContent).toBe('null');
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('token解析失败时，清除token和user', async () => {
      vi.mocked(jwtDecode).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      localStorage.setItem('token', 'invalid-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin' }));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('username').textContent).toBe('null');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('登录功能测试', () => {
    it('成功登录后保存token和user', async () => {
      const mockResponse = {
        access_token: 'new-token',
        user: {
          id: 1,
          username: 'admin',
          role: UserRole.ADMIN,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      vi.mocked(authApi.login).mockResolvedValue(mockResponse);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByText('登录').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('username').textContent).toBe('admin');
      });

      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('登录失败时状态保持不变', async () => {
      const loginError = new Error('登录失败');
      vi.mocked(authApi.login).mockImplementation(() => Promise.reject(loginError));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // 添加unhandled rejection监听器来捕获错误
      const rejectionHandler = vi.fn();
      const removalHandler = vi.fn();
      process.on('unhandledRejection', rejectionHandler);
      process.on('rejectionHandled', removalHandler);

      // 点击登录按钮
      screen.getByText('登录').click();

      // 等待状态更新
      await waitFor(
        () => {
          expect(screen.getByTestId('username').textContent).toBe('null');
          expect(screen.getByTestId('authenticated').textContent).toBe('false');
        },
        { timeout: 1000 }
      );

      // 清理监听器
      process.off('unhandledRejection', rejectionHandler);
      process.off('rejectionHandled', removalHandler);
    });
  });

  describe('游客登录测试', () => {
    it('游客登录设置游客用户', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByText('游客登录').click();
      });

      expect(screen.getByTestId('username').textContent).toBe('游客');
      expect(screen.getByTestId('role').textContent).toBe(UserRole.GUEST);
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('登出功能测试', () => {
    it('登出后清除用户状态', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        role: UserRole.ADMIN,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      vi.mocked(jwtDecode).mockReturnValue({ exp: futureExp } as any);
      localStorage.setItem('token', 'valid-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('username').textContent).toBe('admin');
      });

      await act(async () => {
        screen.getByText('登出').click();
      });

      expect(screen.getByTestId('username').textContent).toBe('null');
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('权限检查测试', () => {
    it('hasRole正确返回用户是否拥有指定角色', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        role: UserRole.ADMIN,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      vi.mocked(jwtDecode).mockReturnValue({ exp: futureExp } as any);
      localStorage.setItem('token', 'valid-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('hasAdmin').textContent).toBe('true');
      });
    });

    it('未登录时hasRole返回false', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('hasAdmin').textContent).toBe('false');
    });
  });
});