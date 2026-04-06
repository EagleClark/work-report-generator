import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '@/services/auth.api';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// API基础路径（与handlers.ts一致）
const API_BASE = 'http://localhost:3001/api';

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('成功登录返回token和用户信息', async () => {
      const result = await authApi.login('admin', 'password123');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('admin');
    });

    it('登录失败抛出错误', async () => {
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.json(
            { message: '用户名或密码错误' },
            { status: 401 }
          );
        })
      );

      await expect(authApi.login('wrong', 'wrong')).rejects.toThrow();
    });

    it('发送正确的请求参数', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/auth/login`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            access_token: 'test-token',
            user: { id: 1, username: 'test', role: 'USER' },
          });
        })
      );

      await authApi.login('testuser', 'testpass');

      expect(capturedBody).toEqual({
        username: 'testuser',
        password: 'testpass',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('获取当前用户信息', async () => {
      // 设置token以便API调用
      localStorage.setItem('token', 'test-token');
      const result = await authApi.getCurrentUser();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('role');
    });

    it('未授权时返回401', async () => {
      server.use(
        http.get(`${API_BASE}/auth/me`, () => {
          return HttpResponse.json(
            { message: '未授权' },
            { status: 401 }
          );
        })
      );

      await expect(authApi.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('成功修改密码', async () => {
      await expect(authApi.changePassword('password123', 'newpassword')).resolves.toBeUndefined();
    });

    it('原密码错误时返回错误', async () => {
      server.use(
        http.post(`${API_BASE}/auth/change-password`, () => {
          return HttpResponse.json(
            { message: '原密码错误' },
            { status: 400 }
          );
        })
      );

      await expect(authApi.changePassword('wrong', 'newpassword')).rejects.toThrow();
    });

    it('发送正确的请求参数', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/auth/change-password`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ message: '成功' });
        })
      );

      await authApi.changePassword('oldpass', 'newpass');

      expect(capturedBody).toEqual({
        oldPassword: 'oldpass',
        newPassword: 'newpass',
      });
    });
  });
});