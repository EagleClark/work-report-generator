import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { ProjectManagementPage } from '@/pages/ProjectManagement.page';
import { server } from '../../mocks/server';
import { mockProjects } from '../../mocks/data';

const API_BASE = 'http://localhost:3001/api';

const { mockNotificationsShow } = vi.hoisted(() => ({
  mockNotificationsShow: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: mockNotificationsShow },
}));

const INITIAL_PROJECTS = [
  { id: 1, name: '项目A', description: '项目A描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: '项目B', description: '项目B描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, name: '项目C', description: '项目C描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProjectManagementPage />
    </MemoryRouter>,
  );

describe('ProjectManagementPage 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjects.length = 0;
    mockProjects.push(...INITIAL_PROJECTS.map((p) => ({ ...p })));
  });

  it('渲染页面标题"项目管理"', () => {
    renderPage();
    expect(screen.getByText('项目管理')).toBeInTheDocument();
  });

  it('渲染"新增项目"按钮', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '新增项目' })).toBeInTheDocument();
  });

  it('从 API 加载并渲染项目列表', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('项目A')).toBeInTheDocument();
    });
    expect(screen.getByText('项目B')).toBeInTheDocument();
    expect(screen.getByText('项目C')).toBeInTheDocument();
  });

  describe('创建项目', () => {
    it('点击"新增项目"打开创建弹窗', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: '新增项目' }));

      // Modal 异步渲染，等待弹窗出现
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入项目名称')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入项目描述（可选）')).toBeInTheDocument();
    });

    it('提交表单创建项目并显示成功通知', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: '新增项目' }));
      await screen.findByRole('dialog');
      const nameInput = screen.getByPlaceholderText('请输入项目名称');
      await user.type(nameInput, '新项目');
      await user.click(screen.getByRole('button', { name: '创建' }));

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: '成功', message: '项目创建成功' }),
        );
      });
    });

    it('创建项目后项目列表刷新', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('项目A')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '新增项目' }));
      await screen.findByRole('dialog');
      const nameInput = screen.getByPlaceholderText('请输入项目名称');
      await user.type(nameInput, '新项目');
      await user.click(screen.getByRole('button', { name: '创建' }));

      await waitFor(() => {
        expect(screen.getByText('新项目')).toBeInTheDocument();
      });
    });

    it('创建项目失败时显示错误通知', async () => {
      server.use(
        http.post(`${API_BASE}/projects`, async () => {
          return HttpResponse.json(
            { message: '项目名称已存在', statusCode: 400 },
            { status: 400 },
          );
        }),
      );

      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: '新增项目' }));
      await screen.findByRole('dialog');
      const nameInput = screen.getByPlaceholderText('请输入项目名称');
      await user.type(nameInput, '项目A');
      await user.click(screen.getByRole('button', { name: '创建' }));

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: '错误' }),
        );
      });
    });

    it('项目名称为空时显示验证错误', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: '新增项目' }));
      // Modal 异步渲染，等待弹窗出现
      await screen.findByRole('dialog');
      // 不输入名称，直接点击创建
      await user.click(screen.getByRole('button', { name: '创建' }));

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: '错误', message: '项目名称不能为空' }),
        );
      });
    });
  });

  describe('编辑项目', () => {
    it('点击编辑按钮打开编辑弹窗并预填充数据', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('项目A')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: '编辑' });
      await user.click(editButtons[0]);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      const nameInput = screen.getByPlaceholderText('请输入项目名称');
      expect(nameInput).toHaveValue('项目A');
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    });

    it('编辑项目后显示成功通知', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('项目A')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: '编辑' });
      await user.click(editButtons[0]);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      const nameInput = screen.getByPlaceholderText('请输入项目名称');
      await user.clear(nameInput);
      await user.type(nameInput, '项目A-已更新');
      await user.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: '成功', message: '项目更新成功' }),
        );
      });
    });
  });

  describe('删除项目', () => {
    it('删除项目前弹出确认对话框', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('项目A')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: '删除' });
      await user.click(deleteButtons[0]);

      // 确认删除的弹窗和按钮都显示"确认删除"文字
      expect(screen.getAllByText('确认删除').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('确定要删除该项目吗？')).toBeInTheDocument();
    });

    it('确认删除后显示成功通知', async () => {
      const user = userEvent.setup();
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('项目A')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: '删除' });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole('button', { name: '确认删除' }));

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ title: '成功', message: '项目删除成功' }),
        );
      });
    });
  });
});
