import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { AIAnalysisModal } from '@/components/AIAnalysisModal/AIAnalysisModal';

describe('AIAnalysisModal 组件', () => {
  const onClose = vi.fn();
  const onGenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('打开时渲染模态框内容', () => {
    render(
      <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
    );

    expect(screen.getByText('AI 智能分析')).toBeInTheDocument();
    expect(screen.getByText('提示')).toBeInTheDocument();
    expect(screen.getByText('开始分析')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('关闭时不渲染内容', () => {
    render(
      <AIAnalysisModal opened={false} onClose={onClose} onGenerate={onGenerate} />,
    );

    expect(screen.queryByText('AI 智能分析')).not.toBeInTheDocument();
  });

  it('文本输入框可编辑', async () => {
    const user = userEvent.setup();
    render(
      <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
    );

    const textarea = screen.getByPlaceholderText(/重点关注人员工作量/);
    await user.type(textarea, '测试提示词');

    expect(textarea).toHaveValue('测试提示词');
  });

  describe('开始分析按钮', () => {
    it('输入提示词后点击调用 onGenerate 并触发 onClose', async () => {
      const user = userEvent.setup();
      render(
        <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
      );

      const textarea = screen.getByPlaceholderText(/重点关注人员工作量/);
      await user.type(textarea, '重点关注项目A');
      await user.click(screen.getByRole('button', { name: '开始分析' }));

      expect(onGenerate).toHaveBeenCalledWith('重点关注项目A');
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('不输入提示词时调用 onGenerate(undefined)', async () => {
      const user = userEvent.setup();
      render(
        <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
      );

      await user.click(screen.getByRole('button', { name: '开始分析' }));

      expect(onGenerate).toHaveBeenCalledWith(undefined);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('只有空白字符时调用 onGenerate(undefined)', async () => {
      const user = userEvent.setup();
      render(
        <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
      );

      const textarea = screen.getByPlaceholderText(/重点关注人员工作量/);
      await user.type(textarea, '   ');
      await user.click(screen.getByRole('button', { name: '开始分析' }));

      expect(onGenerate).toHaveBeenCalledWith(undefined);
    });
  });

  describe('取消按钮', () => {
    it('点击取消触发 onClose（不调用 onGenerate）', async () => {
      const user = userEvent.setup();
      render(
        <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
      );

      await user.click(screen.getByRole('button', { name: '取消' }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(onGenerate).not.toHaveBeenCalled();
    });
  });

  describe('状态清理', () => {
    it('生成后清空输入框内容', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
      );

      const textarea = screen.getByPlaceholderText(/重点关注人员工作量/);
      await user.type(textarea, '分析内容');
      await user.click(screen.getByRole('button', { name: '开始分析' }));

      // 重新打开模态框后输入框应为空
      rerender(
        <AIAnalysisModal opened={true} onClose={onClose} onGenerate={onGenerate} />,
      );

      const textareaAfter = screen.getByPlaceholderText(/重点关注人员工作量/);
      expect(textareaAfter).toHaveValue('');
    });
  });
});
