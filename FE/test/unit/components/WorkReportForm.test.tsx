import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { WorkReportForm } from '@/components/WorkReportForm/WorkReportForm';

describe('WorkReportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('创建模式', () => {
    it('渲染创建表单，包含标题、内容、年份和周数输入', () => {
      render(<WorkReportForm onSubmit={vi.fn()} />);

      expect(screen.getByPlaceholderText('请输入周报标题')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入本周工作内容')).toBeInTheDocument();
      expect(screen.getByLabelText(/^年份/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^周数/)).toBeInTheDocument();
      expect(screen.getByText('提交')).toBeInTheDocument();
    });

    it('不显示取消按钮（未提供 onCancel）', () => {
      render(<WorkReportForm onSubmit={vi.fn()} />);

      expect(screen.queryByText('取消')).not.toBeInTheDocument();
    });

    it('提交后调用 onSubmit 并重置字段', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<WorkReportForm onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText('请输入周报标题'), '测试周报');
      await user.type(screen.getByPlaceholderText('请输入本周工作内容'), '本周工作内容');
      await user.click(screen.getByText('提交'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          title: '测试周报',
          content: '本周工作内容',
          year: expect.any(Number),
          weekNumber: expect.any(Number),
        });
      });

      // 创建成功后字段应重置为空
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(
          '请输入周报标题',
        ) as HTMLInputElement;
        expect(titleInput.value).toBe('');
      });
    });

    it('提交时按钮显示加载状态', async () => {
      let resolvePromise!: (value: unknown) => void;
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; }),
      );
      const user = userEvent.setup();

      render(<WorkReportForm onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText('请输入周报标题'), '测试');
      await user.type(screen.getByPlaceholderText('请输入本周工作内容'), '内容');
      await user.click(screen.getByText('提交'));

      // loading 状态下按钮应有 data-loading 属性
      await waitFor(() => {
        expect(screen.getByText('提交')).toHaveAttribute('data-loading');
      });

      resolvePromise(undefined);

      await waitFor(() => {
        expect(
          screen.getByText('提交').getAttribute('data-loading'),
        ).toBeNull();
      });
    });
  });

  describe('编辑模式', () => {
    const initialData = {
      id: 1,
      title: '原有周报',
      content: '原有内容',
      year: 2025,
      weekNumber: 10,
      createdAt: '2025-03-01T00:00:00.000Z',
      updatedAt: '2025-03-01T00:00:00.000Z',
    };

    it('渲染编辑表单，按钮显示"更新"', () => {
      render(
        <WorkReportForm
          onSubmit={vi.fn()}
          initialData={initialData}
          isEdit={true}
        />,
      );

      expect(screen.getByText('更新')).toBeInTheDocument();
      expect(screen.queryByText('提交')).not.toBeInTheDocument();
    });

    it('回显 initialData 的值', () => {
      render(
        <WorkReportForm
          onSubmit={vi.fn()}
          initialData={initialData}
          isEdit={true}
        />,
      );

      const titleInput = screen.getByPlaceholderText(
        '请输入周报标题',
      ) as HTMLInputElement;
      const contentInput = screen.getByPlaceholderText(
        '请输入本周工作内容',
      ) as HTMLTextAreaElement;
      const yearInput = screen.getByLabelText(/^年份/) as HTMLInputElement;
      const weekInput = screen.getByLabelText(/^周数/) as HTMLInputElement;

      expect(titleInput.value).toBe('原有周报');
      expect(contentInput.value).toBe('原有内容');
      expect(Number(yearInput.value)).toBe(2025);
      expect(Number(weekInput.value)).toBe(10);
    });

    it('编辑模式下提交后不重置字段', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <WorkReportForm
          onSubmit={onSubmit}
          initialData={initialData}
          isEdit={true}
        />,
      );

      // 修改标题
      const titleInput = screen.getByPlaceholderText(
        '请输入周报标题',
      ) as HTMLInputElement;
      await user.clear(titleInput);
      await user.type(titleInput, '更新后的周报');

      await user.click(screen.getByText('更新'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          title: '更新后的周报',
          content: '原有内容',
          year: 2025,
          weekNumber: 10,
        });
      });

      // 编辑模式下字段应保留值
      expect(titleInput.value).toBe('更新后的周报');
    });
  });

  describe('取消按钮', () => {
    it('提供 onCancel 时显示取消按钮', () => {
      render(<WorkReportForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('点击取消按钮调用 onCancel', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<WorkReportForm onSubmit={vi.fn()} onCancel={onCancel} />);

      await user.click(screen.getByText('取消'));

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
