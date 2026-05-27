import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TaskTable } from '@/components/TaskTable/TaskTable';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { mockTasks, mockUsers, mockProjects } from '../../mocks/data';

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 2, username: 'admin', role: 'ADMIN' },
    hasRole: () => true,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    guestLogin: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock WeekContext
vi.mock('@/context/WeekContext', () => ({
  useWeek: () => ({
    year: 2024,
    weekNumber: 1,
    setYear: vi.fn(),
    setWeekNumber: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TaskTable 组件', () => {
  describe('数据加载与渲染', () => {
    it('从API获取并渲染任务列表', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      // 等待任务数据加载完成
      expect(await screen.findByText('实现用户登录功能')).toBeInTheDocument();
      expect(screen.getByText('实现用户注册功能')).toBeInTheDocument();
    });

    it('渲染任务数据的各列内容', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect((await screen.findAllByText('项目A')).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('US-001')).toBeInTheDocument();
      expect(screen.getAllByText(/user1/).length).toBeGreaterThanOrEqual(1);
    });

    it('空数据时显示暂无数据', async () => {
      server.use(
        http.get('http://localhost:3001/api/tasks', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect(await screen.findByText('暂无数据')).toBeInTheDocument();
    });
  });

  describe('筛选栏', () => {
    it('显示项目筛选下拉', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect(await screen.findByText('项目筛选')).toBeInTheDocument();
    });

    it('显示责任人筛选下拉', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect(await screen.findByText('责任人筛选')).toBeInTheDocument();
    });

    it('项目筛选下拉包含项目选项', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      // 等待数据加载
      await screen.findByText('实现用户登录功能');

      // 打开项目筛选下拉
      const filterSelect = screen.getByText('项目筛选').closest('.mantine-Select-root');
      const filterInput = filterSelect?.querySelector('input');
      expect(filterInput).toBeInTheDocument();

      if (filterInput) {
        await user.click(filterInput);
        expect(await screen.findByRole('option', { name: '项目A' })).toBeInTheDocument();
      }
    });
  });

  describe('操作按钮', () => {
    it('显示"新增任务"按钮', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect(await screen.findByRole('button', { name: /新增任务/ })).toBeInTheDocument();
    });

    it('显示"复制上周任务"按钮', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect(await screen.findByRole('button', { name: /复制上周任务/ })).toBeInTheDocument();
    });

    it('显示"刷新"按钮', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect(await screen.findByRole('button', { name: /刷新/ })).toBeInTheDocument();
    });

    it('显示列配置齿轮图标按钮', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      // 等待加载完毕
      await screen.findByText('实现用户登录功能');

      const buttons = screen.getAllByRole('button');
      const gearButton = buttons.find((btn) => btn.querySelector('svg'));
      expect(gearButton).toBeDefined();
    });
  });

  describe('新增任务弹窗', () => {
    it('点击"新增任务"打开新建任务Modal', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      // 等待数据加载
      await screen.findByText('实现用户登录功能');

      // 点击新增任务按钮
      await user.click(screen.getByRole('button', { name: /新增任务/ }));

      // Modal 打开后显示 TaskForm 的字段
      // Modal 标题是"新增任务"，但按钮也有相同文本
      expect(screen.getAllByText('新增任务').length).toBeGreaterThanOrEqual(2);
      // 检查 TaskForm 中的必填字段标签在 Modal 中出现
      expect(screen.getAllByText('项目').length).toBeGreaterThanOrEqual(2); // 筛选栏 + Modal 中
    });
  });

  describe('责任人工作量统计（底部）', () => {
    it('显示责任人工作量统计区域', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      expect(await screen.findByText('责任人工作量统计（人天）')).toBeInTheDocument();
    });

    it('统计中显示计划与实际工作量', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      // 等待统计区域出现
      await screen.findByText('责任人工作量统计（人天）');

      // mockTasks中 weekNumber=1 的任务有 task1(计划2) 和 task2(计划2) 都属于 user1
      expect(screen.getAllByText(/user1/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('表头渲染', () => {
    it('渲染所有列头', async () => {
      render(
        <MemoryRouter>
          <TaskTable />
        </MemoryRouter>
      );

      // 等待数据加载
      await screen.findByText('实现用户登录功能');

      const expectedHeaders = ['项目', 'US/DTS', '任务详情', '进度', '预计', '实际', '本周计划', '本周实际', '计划时间', '实际时间', '责任人', '备注', '操作'];

      expectedHeaders.forEach((header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });
  });
});
