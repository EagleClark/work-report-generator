import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userApi } from '@/services/user.api';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { UserRole } from '@/types/user';

// API基础路径（与handlers.ts一致）
const API_BASE = 'http://localhost:3001/api';

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('获取所有用户', async () => {
      const result = await userApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('返回的用户包含必要字段', async () => {
      const result = await userApi.getAll();

      result.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('role');
      });
    });
  });

  describe('getById', () => {
    it('获取单个用户', async () => {
      const result = await userApi.getById(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
    });

    it('用户不存在时返回404', async () => {
      server.use(
        http.get(`${API_BASE}/users/999`, () => {
          return HttpResponse.json(
            { message: '用户不存在' },
            { status: 404 }
          );
        })
      );

      await expect(userApi.getById(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('创建新用户', async () => {
      const result = await userApi.create({
        username: 'newuser',
        password: 'password123',
        role: UserRole.USER,
      });

      expect(result).toHaveProperty('id');
      expect(result.username).toBe('newuser');
    });

    it('默认角色为USER', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/users`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            username: capturedBody.username,
            role: capturedBody.role || 'USER',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      await userApi.create({
        username: 'testuser',
        password: 'password123',
      });

      expect(capturedBody.role).toBeUndefined();
    });

    it('发送正确的请求体', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/users`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            ...capturedBody,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      await userApi.create({
        username: 'testuser',
        password: 'password123',
        role: UserRole.ADMIN,
      });

      expect(capturedBody).toEqual({
        username: 'testuser',
        password: 'password123',
        role: UserRole.ADMIN,
      });
    });
  });

  describe('update', () => {
    it('更新用户', async () => {
      const result = await userApi.update(1, { username: 'updated' });

      expect(result).toHaveProperty('id');
    });

    it('用户不存在时返回404', async () => {
      server.use(
        http.put(`${API_BASE}/users/999`, () => {
          return HttpResponse.json(
            { message: '用户不存在' },
            { status: 404 }
          );
        })
      );

      await expect(userApi.update(999, { username: 'test' })).rejects.toThrow();
    });

    it('更新角色', async () => {
      let capturedBody: any;
      server.use(
        http.put(`${API_BASE}/users/:id`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            username: 'test',
            ...capturedBody,
            updatedAt: new Date().toISOString(),
          });
        })
      );

      await userApi.update(1, { role: UserRole.ADMIN });

      expect(capturedBody.role).toBe(UserRole.ADMIN);
    });
  });

  describe('delete', () => {
    it('删除用户', async () => {
      await expect(userApi.delete(1)).resolves.toBeUndefined();
    });

    it('用户不存在时返回404', async () => {
      server.use(
        http.delete(`${API_BASE}/users/999`, () => {
          return HttpResponse.json(
            { message: '用户不存在' },
            { status: 404 }
          );
        })
      );

      await expect(userApi.delete(999)).rejects.toThrow();
    });
  });
});