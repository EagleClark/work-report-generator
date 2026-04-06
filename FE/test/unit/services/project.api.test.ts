import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectApi } from '@/services/project.api';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// API基础路径（与handlers.ts一致）
const API_BASE = 'http://localhost:3001/api';

describe('projectApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('获取所有项目', async () => {
      const result = await projectApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('返回的项目包含必要字段', async () => {
      const result = await projectApi.getAll();

      result.forEach(project => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
      });
    });
  });

  describe('getById', () => {
    it('获取单个项目', async () => {
      const result = await projectApi.getById(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    it('项目不存在时返回404', async () => {
      server.use(
        http.get(`${API_BASE}/projects/999`, () => {
          return HttpResponse.json(
            { message: '项目不存在' },
            { status: 404 }
          );
        })
      );

      await expect(projectApi.getById(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('创建新项目', async () => {
      const result = await projectApi.create({
        name: '新项目',
        description: '项目描述',
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('新项目');
    });

    it('发送正确的请求体', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/projects`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            ...capturedBody,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      await projectApi.create({
        name: '测试项目',
        description: '测试描述',
      });

      expect(capturedBody).toEqual({
        name: '测试项目',
        description: '测试描述',
      });
    });

    it('创建不带描述的项目', async () => {
      const result = await projectApi.create({ name: '简单项目' });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('简单项目');
    });
  });

  describe('update', () => {
    it('更新项目', async () => {
      const result = await projectApi.update(1, { name: '更新后的项目' });

      expect(result).toHaveProperty('id');
    });

    it('项目不存在时返回404', async () => {
      server.use(
        http.put(`${API_BASE}/projects/999`, () => {
          return HttpResponse.json(
            { message: '项目不存在' },
            { status: 404 }
          );
        })
      );

      await expect(projectApi.update(999, { name: 'test' })).rejects.toThrow();
    });

    it('更新项目描述', async () => {
      let capturedBody: any;
      server.use(
        http.put(`${API_BASE}/projects/:id`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            name: 'test',
            ...capturedBody,
            updatedAt: new Date().toISOString(),
          });
        })
      );

      await projectApi.update(1, { description: '新描述' });

      expect(capturedBody.description).toBe('新描述');
    });
  });

  describe('delete', () => {
    it('删除项目', async () => {
      await expect(projectApi.delete(1)).resolves.toBeUndefined();
    });

    it('项目不存在时返回404', async () => {
      server.use(
        http.delete(`${API_BASE}/projects/999`, () => {
          return HttpResponse.json(
            { message: '项目不存在' },
            { status: 404 }
          );
        })
      );

      await expect(projectApi.delete(999)).rejects.toThrow();
    });
  });
});