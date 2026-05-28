import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '@/components/TaskForm/TaskForm';
import { UserRole } from '@/types/user';
import type { User } from '@/types/user';
import type { Project } from '@/services/project.api';

const mockUsers: User[] = [
  { id: 1, username: 'admin', role: UserRole.ADMIN as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, username: 'user1', role: UserRole.USER, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, username: 'superadmin', role: UserRole.SUPER_ADMIN, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

const mockProjects: Project[] = [
  { id: 1, name: '项目A', description: '项目A描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: '项目B', description: '项目B描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

describe('TaskForm 组件（新增模式）', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  });

  describe('表单字段渲染', () => {
    it('渲染所有必填字段标签', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      expect(screen.getByText('项目')).toBeInTheDocument();
      expect(screen.getByText('责任人')).toBeInTheDocument();
      expect(screen.getByText('任务详情')).toBeInTheDocument();
      expect(screen.getByText('预计工作量')).toBeInTheDocument();
      expect(screen.getByText('计划本周投入')).toBeInTheDocument();
      expect(screen.getByText('计划开始时间')).toBeInTheDocument();
      expect(screen.getByText('计划结束时间')).toBeInTheDocument();
      expect(screen.getByText('年份')).toBeInTheDocument();
      expect(screen.getByText('周数')).toBeInTheDocument();
      expect(screen.getByText('备注')).toBeInTheDocument();
    });

    it('渲染非必填字段 US/DTS', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      expect(screen.getByText('US/DTS')).toBeInTheDocument();
      expect(screen.getByText('US/DTS链接')).toBeInTheDocument();
    });

    it('渲染提交按钮', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      expect(screen.getByRole('button', { name: /提交/ })).toBeInTheDocument();
    });
  });

  function submitForm() {
    // 直接触发表单 submit 事件，绕过 HTML5 required 验证
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
  }

  describe('必填验证', () => {
    it('空表单提交时显示验证错误', () => {
      const { container } = render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      submitForm();

      expect(screen.getByText('项目名称不能为空')).toBeInTheDocument();
      expect(screen.getByText('责任人不能为空')).toBeInTheDocument();
      expect(screen.getByText('任务详情不能为空')).toBeInTheDocument();
      expect(screen.getByText('预计工作量必须大于0')).toBeInTheDocument();
    });

    it('预计工作量为0时触发预计工作量验证', () => {
      const { container } = render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      submitForm();

      expect(screen.getByText('预计工作量必须大于0')).toBeInTheDocument();
    });

    it('填写必填字段后验证错误不出现', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 1, username: 'admin', role: UserRole.ADMIN }}
          defaultYear={2024}
          defaultWeekNumber={1}
        />
      );

      // 选择项目
      const projectInput = screen.getByRole('textbox', { name: /项目/ });
      await user.click(projectInput);
      const option = await screen.findByRole('option', { name: '项目A' });
      await user.click(option);

      // 填写任务详情
      const detailInput = screen.getByRole('textbox', { name: /任务详情/ });
      await user.type(detailInput, '测试任务');

      // 填写预计工作量
      const estimatedInput = screen.getByRole('textbox', { name: /预计工作量/ });
      await user.clear(estimatedInput);
      await user.type(estimatedInput, '5');

      // 责任人 admin 默认已选中

      submitForm();

      // 验证错误不应出现
      expect(screen.queryByText('项目名称不能为空')).not.toBeInTheDocument();
      expect(screen.queryByText('任务详情不能为空')).not.toBeInTheDocument();
      expect(screen.queryByText('预计工作量必须大于0')).not.toBeInTheDocument();
    });
  });

  describe('提交功能', () => {
    it('提交有效表单数据调用onSubmit', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 1, username: 'admin', role: UserRole.ADMIN }}
          defaultYear={2024}
          defaultWeekNumber={1}
        />
      );

      // 选择项目
      const projectInput = screen.getByRole('textbox', { name: /项目/ });
      await user.click(projectInput);
      const projectOption = await screen.findByRole('option', { name: '项目A' });
      await user.click(projectOption);

      // 填写任务详情
      const detailInput = screen.getByRole('textbox', { name: /任务详情/ });
      await user.type(detailInput, '单元测试任务');

      // 填写预计工作量
      const estimatedInput = screen.getByRole('textbox', { name: /预计工作量/ });
      await user.clear(estimatedInput);
      await user.type(estimatedInput, '3');

      // 提交（使用 fireEvent.submit 绕过 HTML5 required 验证）
      submitForm();

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          project: '项目A',
          taskDetail: '单元测试任务',
          estimatedWorkload: 3,
          year: 2024,
          weekNumber: 1,
        })
      );
    });

    it('提交后表单不包含编辑模式下才有的字段', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 1, username: 'admin', role: UserRole.ADMIN }}
          defaultYear={2024}
          defaultWeekNumber={1}
        />
      );

      const projectInput = screen.getByRole('textbox', { name: /项目/ });
      await user.click(projectInput);
      const option = await screen.findByRole('option', { name: '项目A' });
      await user.click(option);

      const detailInput = screen.getByRole('textbox', { name: /任务详情/ });
      await user.type(detailInput, '测试');

      const estimatedInput = screen.getByRole('textbox', { name: /预计工作量/ });
      await user.clear(estimatedInput);
      await user.type(estimatedInput, '2');

      // 提交（使用 fireEvent.submit 绕过 HTML5 required 验证）
      submitForm();

      // 提交的数据不应包含编辑模式字段
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.progress).toBeUndefined();
      expect(submittedData.actualWorkload).toBeUndefined();
      expect(submittedData.weeklyWorkload).toBeUndefined();
      expect(submittedData.actualStartDate).toBeUndefined();
      expect(submittedData.actualEndDate).toBeUndefined();
    });
  });

  describe('责任人默认值', () => {
    it('ADMIN角色创建任务时默认选中自己为责任人', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 1, username: 'admin', role: UserRole.ADMIN }}
        />
      );

      const assigneeContainer = screen.getByText('责任人').closest('.mantine-Select-root');
      const assigneeInput = assigneeContainer?.querySelector('input');
      expect(assigneeInput).toHaveValue('admin');
    });

    it('USER角色创建任务时默认选中自己且输入框禁用', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 2, username: 'user1', role: UserRole.USER }}
        />
      );

      const assigneeContainer = screen.getByText('责任人').closest('.mantine-Select-root');
      const assigneeInput = assigneeContainer?.querySelector('input');
      expect(assigneeInput).toHaveValue('user1');
      expect(assigneeInput).toBeDisabled();
    });

    it('SUPER_ADMIN角色创建任务时不默认选中责任人', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 3, username: 'superadmin', role: UserRole.SUPER_ADMIN }}
        />
      );

      const assigneeContainer = screen.getByText('责任人').closest('.mantine-Select-root');
      const assigneeInput = assigneeContainer?.querySelector('input');
      expect(assigneeInput).toHaveValue('');
    });

    it('未提供当前用户时责任人为空', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      const assigneeContainer = screen.getByText('责任人').closest('.mantine-Select-root');
      const assigneeInput = assigneeContainer?.querySelector('input');
      expect(assigneeInput).toHaveValue('');
    });
  });

  describe('项目下拉列表', () => {
    it('显示项目下拉选项', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      const projectInput = screen.getByRole('textbox', { name: /项目/ });
      await user.click(projectInput);

      expect(await screen.findByRole('option', { name: '项目A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '项目B' })).toBeInTheDocument();
    });
  });

  describe('取消功能', () => {
    it('提供onCancel时显示取消按钮', () => {
      const mockOnCancel = vi.fn();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      expect(screen.getByRole('button', { name: /取消/ })).toBeInTheDocument();
    });

    it('点击取消按钮调用onCancel', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      await user.click(screen.getByRole('button', { name: /取消/ }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('没有onCancel时不显示取消按钮', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      expect(screen.queryByRole('button', { name: /取消/ })).not.toBeInTheDocument();
    });
  });

  describe('US/DTS链接验证', () => {
    it('输入无效URL时显示验证错误', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 1, username: 'admin', role: UserRole.ADMIN }}
          defaultYear={2024}
          defaultWeekNumber={1}
        />
      );

      const linkInput = screen.getByRole('textbox', { name: /US\/DTS链接/ });
      await user.type(linkInput, '不是有效链接');

      submitForm();

      expect(screen.getByText('请输入有效的URL链接')).toBeInTheDocument();
    });

    it('空URL不触发验证错误', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 1, username: 'admin', role: UserRole.ADMIN }}
          defaultYear={2024}
          defaultWeekNumber={1}
        />
      );

      const projectInput = screen.getByRole('textbox', { name: /项目/ });
      await user.click(projectInput);
      const option = await screen.findByRole('option', { name: '项目A' });
      await user.click(option);

      const detailInput = screen.getByRole('textbox', { name: /任务详情/ });
      await user.type(detailInput, '测试任务');

      const estimatedInput = screen.getByRole('textbox', { name: /预计工作量/ });
      await user.clear(estimatedInput);
      await user.type(estimatedInput, '3');

      // US/DTS链接留空
      submitForm();

      // 不应出现URL验证错误
      expect(screen.queryByText('请输入有效的URL链接')).not.toBeInTheDocument();
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('输入有效URL不触发验证错误', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
          currentUser={{ id: 1, username: 'admin', role: UserRole.ADMIN }}
          defaultYear={2024}
          defaultWeekNumber={1}
        />
      );

      const linkInput = screen.getByRole('textbox', { name: /US\/DTS链接/ });
      await user.type(linkInput, 'https://example.com/task/123');

      const projectInput = screen.getByRole('textbox', { name: /项目/ });
      await user.click(projectInput);
      const option = await screen.findByRole('option', { name: '项目A' });
      await user.click(option);

      const detailInput = screen.getByRole('textbox', { name: /任务详情/ });
      await user.type(detailInput, '测试');

      const estimatedInput = screen.getByRole('textbox', { name: /预计工作量/ });
      await user.clear(estimatedInput);
      await user.type(estimatedInput, '3');

      submitForm();

      expect(screen.queryByText('请输入有效的URL链接')).not.toBeInTheDocument();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('文本框长度限制', () => {
    it('任务详情有maxLength=200限制', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      const detailInput = screen.getByRole('textbox', { name: /任务详情/ });
      expect(detailInput).toHaveAttribute('maxLength', '200');
    });

    it('备注有maxLength=500限制', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      const remarkInput = screen.getByRole('textbox', { name: /备注/ });
      expect(remarkInput).toHaveAttribute('maxLength', '500');
    });
  });

  describe('编辑模式下不出现的字段', () => {
    it('新增模式下不显示实际工作量相关字段', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          users={mockUsers}
          projects={mockProjects}
        />
      );

      expect(screen.queryByText('实际工作量')).not.toBeInTheDocument();
      expect(screen.queryByText('实际开始时间')).not.toBeInTheDocument();
      expect(screen.queryByText('实际结束时间')).not.toBeInTheDocument();
    });
  });
});
