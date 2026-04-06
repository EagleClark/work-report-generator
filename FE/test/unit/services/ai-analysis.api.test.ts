import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiAnalysisApi } from '@/services/ai-analysis.api';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// API基础路径（与handlers.ts一致）
const API_BASE = 'http://localhost:3001/api';

describe('aiAnalysisApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('获取所有AI分析', async () => {
      const result = await aiAnalysisApi.getAll();

      expect(Array.isArray(result)).toBe(true);
    });

    it('带查询参数获取分析', async () => {
      const result = await aiAnalysisApi.getAll({ year: 2024, weekNumber: 1 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCurrent', () => {
    it('获取当前周的AI分析', async () => {
      const result = await aiAnalysisApi.getCurrent(2024, 1);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('analysisContent');
    });

    it('没有分析时返回null', async () => {
      const result = await aiAnalysisApi.getCurrent(2024, 99);

      expect(result).toBeNull();
    });

    it('正确传递年份和周次参数', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${API_BASE}/ai-analysis/current`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(null);
        })
      );

      await aiAnalysisApi.getCurrent(2024, 15);

      expect(capturedUrl).toContain('year=2024');
      expect(capturedUrl).toContain('weekNumber=15');
    });
  });

  describe('generate', () => {
    it('生成AI分析', async () => {
      const result = await aiAnalysisApi.generate({
        year: 2024,
        weekNumber: 1,
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('analysisContent');
    });

    it('带自定义提示词生成', async () => {
      let capturedBody: any;
      server.use(
        http.post(`${API_BASE}/ai-analysis/generate`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            year: 2024,
            weekNumber: 1,
            analysisContent: '分析内容',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      await aiAnalysisApi.generate({
        year: 2024,
        weekNumber: 2,
        userPrompt: '重点关注进度',
      });

      expect(capturedBody.userPrompt).toBe('重点关注进度');
    });
  });

  describe('delete', () => {
    it('删除AI分析', async () => {
      await expect(aiAnalysisApi.delete(1)).resolves.toBeUndefined();
    });

    it('分析不存在时返回404', async () => {
      server.use(
        http.delete(`${API_BASE}/ai-analysis/999`, () => {
          return HttpResponse.json(
            { message: '分析不存在' },
            { status: 404 }
          );
        })
      );

      await expect(aiAnalysisApi.delete(999)).rejects.toThrow();
    });
  });
});