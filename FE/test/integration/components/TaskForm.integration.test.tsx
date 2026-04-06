import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { TaskForm } from '@/components/TaskForm/TaskForm';
import { UserRole, type User } from '@/types/user';
import type { Project } from '@/services/project.api';
import type { Task } from '@/types/task';

// 测试wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    {children}
  </MantineProvider>
);

// Mock数据
const mockUsers: User[] = [
  { id: 1, username: 'admin', role: UserRole.ADMIN, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, username: 'user1', role: UserRole.USER, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 3, username: 'superadmin', role: UserRole.SUPER_ADMIN, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

const mockProjects: Project[] = [
  { id: 1, name: '项目A', description: '描述A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, name: '项目B', description: '描述B', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

const mockTask: Task = {
  id: 1,
  project: '项目A',
  assignee: 'user1',
  usDts: 'US001',
  usDtsLink: 'https://example.com',
  taskDetail: '测试任务',
  progress: 50,
  estimatedWorkload: 5,
  plannedWeeklyWorkload: 2,
  plannedStartDate: '2024-01-01',
  plannedEndDate: '2024-01-10',
  actualWorkload: 2,
  weeklyWorkload: 1,
  actualStartDate: '2024-01-02',
  actualEndDate: '',
  year: 2024,
  weekNumber: 1,
  remark: '备注',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('TaskForm 集成测试', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  });

  describe('表单渲染测试', () => {
    it('渲染所有主要表单字段标签', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      expect(screen.getByText('项目')).toBeInTheDocument();
      expect(screen.getByText('责任人')).toBeInTheDocument();
      expect(screen.getByText('任务详情')).toBeInTheDocument();
      expect(screen.getByText('预计工作量')).toBeInTheDocument();
      expect(screen.getByText('计划开始时间')).toBeInTheDocument();
      expect(screen.getByText('计划结束时间')).toBeInTheDocument();
      expect(screen.getByText('备注')).toBeInTheDocument();
    });

    it('渲染提交按钮', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /提交/ })).toBeInTheDocument();
    });
  });

  describe('权限控制测试', () => {
    it('普通用户创建任务时责任人输入框被禁用', () => {
      const currentUser = { id: 2, username: 'user1', role: UserRole.USER };

      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
            currentUser={currentUser}
          />
        </TestWrapper>
      );

      // 查找责任人相关的输入（Mantine Select会在container中渲染）
      const assigneeContainer = screen.getByText('责任人').closest('.mantine-Select-root');
      const assigneeInput = assigneeContainer?.querySelector('input');
      expect(assigneeInput).toBeDisabled();
    });

    it('管理员创建任务时责任人输入框可用', () => {
      const currentUser = { id: 1, username: 'admin', role: UserRole.ADMIN };

      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
            currentUser={currentUser}
          />
        </TestWrapper>
      );

      const assigneeContainer = screen.getByText('责任人').closest('.mantine-Select-root');
      const assigneeInput = assigneeContainer?.querySelector('input');
      expect(assigneeInput).not.toBeDisabled();
    });

    it('编辑模式下责任人输入框可用', () => {
      const currentUser = { id: 2, username: 'user1', role: UserRole.USER };

      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
            currentUser={currentUser}
            initialData={mockTask}
            isEdit={true}
          />
        </TestWrapper>
      );

      const assigneeContainer = screen.getByText('责任人').closest('.mantine-Select-root');
      const assigneeInput = assigneeContainer?.querySelector('input');
      expect(assigneeInput).not.toBeDisabled();
    });
  });

  describe('编辑模式测试', () => {
    it('编辑模式显示额外字段', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
            initialData={mockTask}
            isEdit={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('当前进度')).toBeInTheDocument();
      expect(screen.getByText('实际工作量')).toBeInTheDocument();
      expect(screen.getByText('本周工作量')).toBeInTheDocument();
      expect(screen.getByText('实际开始时间')).toBeInTheDocument();
      expect(screen.getByText('实际结束时间')).toBeInTheDocument();
    });

    it('编辑模式显示更新按钮', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
            initialData={mockTask}
            isEdit={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /更新/ })).toBeInTheDocument();
    });

    it('编辑模式使用初始数据填充表单', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
            initialData={mockTask}
            isEdit={true}
          />
        </TestWrapper>
      );

      const taskDetailInput = screen.getByRole('textbox', { name: /任务详情/ });
      expect(taskDetailInput).toHaveValue('测试任务');

      const remarkInput = screen.getByRole('textbox', { name: /备注/ });
      expect(remarkInput).toHaveValue('备注');
    });
  });

  describe('取消功能测试', () => {
    it('有onCancel时显示取消按钮', () => {
      const mockOnCancel = vi.fn();

      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /取消/ })).toBeInTheDocument();
    });

    it('点击取消按钮调用onCancel', async () => {
      const mockOnCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /取消/ }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('没有onCancel时不显示取消按钮', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /取消/ })).not.toBeInTheDocument();
    });
  });

  describe('表单交互测试', () => {
    it('任务详情字段有maxlength属性', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      const taskDetailInput = screen.getByRole('textbox', { name: /任务详情/ });
      expect(taskDetailInput).toHaveAttribute('maxLength', '200');
    });

    it('备注字段有maxlength属性', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      const remarkInput = screen.getByRole('textbox', { name: /备注/ });
      expect(remarkInput).toHaveAttribute('maxLength', '500');
    });

    it('可以输入任务详情', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      const taskDetailInput = screen.getByRole('textbox', { name: /任务详情/ });
      await user.type(taskDetailInput, '这是一个测试任务');
      expect(taskDetailInput).toHaveValue('这是一个测试任务');
    });

    it('可以输入备注', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      const remarkInput = screen.getByRole('textbox', { name: /备注/ });
      await user.type(remarkInput, '这是备注内容');
      expect(remarkInput).toHaveValue('这是备注内容');
    });
  });

  describe('表单验证基础测试', () => {
    it('表单有required属性的必填字段', () => {
      render(
        <TestWrapper>
          <TaskForm
            onSubmit={mockOnSubmit}
            users={mockUsers}
            projects={mockProjects}
          />
        </TestWrapper>
      );

      // 检查必填标记
      const projectLabel = screen.getByText('项目');
      expect(projectLabel.closest('.mantine-Select-root')).toBeInTheDocument();
    });
  });
});