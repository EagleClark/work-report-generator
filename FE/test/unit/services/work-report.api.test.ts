import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workReportApi } from '@/services/work-report.api';

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

const mockReport = {
  id: 1,
  title: '测试周报',
  content: '本周工作内容',
  weekNumber: 10,
  year: 2024,
  userId: 1,
  createdAt: '2024-03-01T00:00:00.000Z',
  updatedAt: '2024-03-07T00:00:00.000Z',
};

describe('workReportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('获取全部周报（无查询参数）', async () => {
      mockGet.mockResolvedValue({ data: [mockReport] });

      const result = await workReportApi.getAll();

      expect(mockGet).toHaveBeenCalledWith('/work-reports');
      expect(result).toEqual([mockReport]);
    });

    it('带年份和周次参数查询周报', async () => {
      mockGet.mockResolvedValue({ data: [mockReport] });

      const result = await workReportApi.getAll({ year: 2024, weekNumber: 10 });

      expect(mockGet).toHaveBeenCalledWith(
        '/work-reports?year=2024&weekNumber=10',
      );
      expect(result).toEqual([mockReport]);
    });

    it('只传年份参数', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await workReportApi.getAll({ year: 2024 });

      expect(mockGet).toHaveBeenCalledWith('/work-reports?year=2024');
    });

    it('只传周次参数', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await workReportApi.getAll({ weekNumber: 5 });

      expect(mockGet).toHaveBeenCalledWith('/work-reports?weekNumber=5');
    });

    it('不传参数时 URL 无查询字符串', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await workReportApi.getAll();

      expect(mockGet).toHaveBeenCalledWith('/work-reports');
    });
  });

  describe('getById', () => {
    it('根据 ID 获取周报', async () => {
      mockGet.mockResolvedValue({ data: mockReport });

      const result = await workReportApi.getById(1);

      expect(mockGet).toHaveBeenCalledWith('/work-reports/1');
      expect(result).toEqual(mockReport);
    });
  });

  describe('create', () => {
    it('创建周报并返回新记录', async () => {
      const dto = {
        title: '新周报',
        content: '第11周工作内容',
        weekNumber: 11,
        year: 2024,
      };
      const newReport = {
        ...dto,
        id: 2,
        userId: 1,
        createdAt: '2024-03-08T00:00:00.000Z',
        updatedAt: '2024-03-08T00:00:00.000Z',
      };
      mockPost.mockResolvedValue({ data: newReport });

      const result = await workReportApi.create(dto);

      expect(mockPost).toHaveBeenCalledWith('/work-reports', dto);
      expect(result).toEqual(newReport);
    });
  });

  describe('update', () => {
    it('更新周报并返回更新后的记录', async () => {
      const dto = { title: '更新标题', content: '更新内容' };
      const updated = {
        ...mockReport,
        ...dto,
        updatedAt: '2024-03-08T00:00:00.000Z',
      };
      mockPut.mockResolvedValue({ data: updated });

      const result = await workReportApi.update(1, dto);

      expect(mockPut).toHaveBeenCalledWith('/work-reports/1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('删除周报', async () => {
      mockDelete.mockResolvedValue({});

      await workReportApi.delete(1);

      expect(mockDelete).toHaveBeenCalledWith('/work-reports/1');
    });

    it('删除不返回值（void）', async () => {
      mockDelete.mockResolvedValue({});

      const result = await workReportApi.delete(1);

      expect(result).toBeUndefined();
    });
  });
});
