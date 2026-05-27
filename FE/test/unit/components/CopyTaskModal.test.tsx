import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { CopyTaskModal } from '@/components/CopyTaskModal/CopyTaskModal';
import { UserRole } from '@/types/user';
import type { User } from '@/types/user';

const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockCopyIncompleteTasks = vi.fn();
vi.mock('@/services/task.api', () => ({
  taskApi: {
    copyIncompleteTasks: (...args: any[]) => mockCopyIncompleteTasks(...args),
  },
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const mockUsers: User[] = [
  { id: 1, username: 'user1', role: UserRole.USER, createdAt: '', updatedAt: '' },
  { id: 2, username: 'admin1', role: UserRole.ADMIN, createdAt: '', updatedAt: '' },
];

describe('CopyTaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: 'admin1', role: UserRole.ADMIN },
      hasRole: () => true,
    });
  });

  it('弹窗关闭时不渲染内容', () => {
    render(
      <CopyTaskModal opened={false} onClose={vi.fn()} onSuccess={vi.fn()} users={mockUsers} />,
    );
    expect(screen.queryByText('复制上周未完成任务')).not.toBeInTheDocument();
  });

  it('弹窗打开时显示确认按钮', () => {
    render(
      <CopyTaskModal opened={true} onClose={vi.fn()} onSuccess={vi.fn()} users={mockUsers} />,
    );
    expect(screen.getByRole('button', { name: /开始复制/ })).toBeInTheDocument();
  });

  it('提交成功显示通知并调用回调', async () => {
    mockCopyIncompleteTasks.mockResolvedValue({
      copiedCount: 3,
      skippedCount: 1,
      skippedTasks: [{ task: '任务X', reason: '已存在相同任务' }],
    });

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CopyTaskModal opened={true} onClose={onClose} onSuccess={onSuccess} users={mockUsers} />,
    );

    await user.click(screen.getByRole('button', { name: /开始复制/ }));

    await waitFor(() => {
      expect(mockCopyIncompleteTasks).toHaveBeenCalledWith({
        year: expect.any(Number),
        weekNumber: expect.any(Number),
        copyMode: 'SELF',
        userId: undefined,
      });
    });
  });

  it('API 失败后显示错误通知', async () => {
    mockCopyIncompleteTasks.mockRejectedValue(new Error('网络错误'));

    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(
      <CopyTaskModal opened={true} onClose={vi.fn()} onSuccess={onSuccess} users={mockUsers} />,
    );

    await user.click(screen.getByRole('button', { name: /开始复制/ }));

    const { notifications } = await import('@mantine/notifications');
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: '复制失败', color: 'red' }),
      );
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
