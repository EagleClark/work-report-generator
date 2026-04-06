import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskApi } from '@/services/task.api';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { CopyMode } from '@/types/task';

// API基础路径（与handlers.ts一致）
const API_BASE = 'http://localhost:3001/api';

describe('taskApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('获取所有任务', async () => {
      const result = await taskApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('带查询参数获取任务', async () => {
      const result = await taskApi.getAll({ year: 2024, weekNumber: 1 });

      expect(Array.isArray(result)).toBe(true);
    });

    it('按项目筛选任务', async () => {
      const result = await taskApi.getAll({ project: '项目A' });

      expect(Array.isArray(result)).toBe(true);
    });

    it('正确构建查询参数', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE}/tasks`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json([]);
        })
      );

      await taskApi.getAll({ year: 2024, weekNumber: 10, project: '项目A' });

      expect(capturedUrl).toContain('year=2024');
      expect(capturedUrl).toContain('weekNumber=10');
      expect(capturedUrl).toContain('project=%E9%A1%B9%E7%9B%AEA');
    });
  });

  describe('getById', () => {
    it('获取单个任务', async () => {
      const result = await taskApi.getById(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('taskDetail');
    });

    it('任务不存在时返回404', async () => {
      server.use(
        http.get(`${API_BASE}/tasks/999`, () => {
          return HttpResponse.json(
            { message: '任务不存在' },
            { status: 404 }
          );
        })
      );

      await expect(taskApi.getById(999)).rejects.toThrow();
    });
  });

  describe('getWeeklySummary', () => {
    it('获取周报汇总', async () => {
      const result = await taskApi.getWeeklySummary(2024, 1);

      expect(result).toHaveProperty('totalTasks');
      expect(result).toHaveProperty('tasks');
    });

    it('正确传递年份和周次参数', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE}/tasks/summary`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            totalTasks: 0,
            tasks: [],
          });
        })
      );

      await taskApi.getWeeklySummary(2024, 15);

      expect(capturedUrl).toContain('year=2024');
      expect(capturedUrl).toContain('weekNumber=15');
    });
  });

  describe('create', () => {
    it('创建新任务', async () => {
      const newTask = {
        project: '新项目',
        taskDetail: '新任务',
        progress: 0,
        estimatedWorkload: 5,
        weeklyWorkload: 0,
        plannedWeeklyWorkload: 2,
        weekNumber: 1,
        year: 2024,
      };

      const result = await taskApi.create(newTask);

      expect(result).toHaveProperty('id');
      expect(result.project).toBe('新项目');
      expect(result.taskDetail).toBe('新任务');
    });

    it('发送正确的请求体', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/tasks`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            ...capturedBody,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      await taskApi.create({
        project: '测试项目',
        taskDetail: '测试任务',
        plannedWeeklyWorkload: 2,
        weekNumber: 1,
        year: 2024,
      });

      expect(capturedBody.project).toBe('测试项目');
      expect(capturedBody.taskDetail).toBe('测试任务');
    });
  });

  describe('update', () => {
    it('更新任务', async () => {
      const result = await taskApi.update(1, { progress: 80 });

      expect(result).toHaveProperty('id');
    });

    it('任务不存在时返回404', async () => {
      server.use(
        http.put(`${API_BASE}/tasks/999`, () => {
          return HttpResponse.json(
            { message: '任务不存在' },
            { status: 404 }
          );
        })
      );

      await expect(taskApi.update(999, { progress: 100 })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('删除任务', async () => {
      await expect(taskApi.delete(1)).resolves.toBeUndefined();
    });

    it('任务不存在时返回404', async () => {
      server.use(
        http.delete(`${API_BASE}/tasks/999`, () => {
          return HttpResponse.json(
            { message: '任务不存在' },
            { status: 404 }
          );
        })
      );

      await expect(taskApi.delete(999)).rejects.toThrow();
    });
  });

  describe('copyIncompleteTasks', () => {
    it('复制未完成任务', async () => {
      const result = await taskApi.copyIncompleteTasks({
        year: 2024,
        weekNumber: 2,
        copyMode: CopyMode.SELF,
      });

      expect(result).toHaveProperty('copiedCount');
      expect(result).toHaveProperty('skippedCount');
      expect(result).toHaveProperty('skippedTasks');
    });

    it('发送正确的复制参数', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/tasks/copy`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            copiedCount: 0,
            skippedCount: 0,
            skippedTasks: [],
          });
        })
      );

      await taskApi.copyIncompleteTasks({
        year: 2024,
        weekNumber: 2,
        copyMode: CopyMode.ALL,
      });

      expect(capturedBody.year).toBe(2024);
      expect(capturedBody.weekNumber).toBe(2);
      expect(capturedBody.copyMode).toBe(CopyMode.ALL);
    });

    it('指定用户复制', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/tasks/copy`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            copiedCount: 0,
            skippedCount: 0,
            skippedTasks: [],
          });
        })
      );

      await taskApi.copyIncompleteTasks({
        year: 2024,
        weekNumber: 2,
        copyMode: CopyMode.SPECIFIC_USER,
        userId: 3,
      });

      expect(capturedBody.userId).toBe(3);
      expect(capturedBody.copyMode).toBe(CopyMode.SPECIFIC_USER);
    });
  });
});