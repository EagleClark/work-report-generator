import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { HelpModal, HelpButton } from '@/components/HelpModal/HelpModal';

describe('HelpModal 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HelpModal', () => {
    const onClose = vi.fn();

    it('打开时渲染帮助内容', () => {
      render(<HelpModal opened={true} onClose={onClose} />);

      expect(screen.getByText('使用帮助')).toBeInTheDocument();
      expect(screen.getByText('AI智能分析')).toBeInTheDocument();
      expect(screen.getByText('表格字段说明')).toBeInTheDocument();
      expect(screen.getByText('操作机制说明')).toBeInTheDocument();
    });

    it('关闭时不渲染内容', () => {
      render(<HelpModal opened={false} onClose={onClose} />);

      expect(screen.queryByText('使用帮助')).not.toBeInTheDocument();
    });

    it('点击"我知道了"按钮触发 onClose', async () => {
      const user = userEvent.setup();
      render(<HelpModal opened={true} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: '我知道了' }));

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('渲染字段说明表格', () => {
      render(<HelpModal opened={true} onClose={onClose} />);

      expect(screen.getByText('项目')).toBeInTheDocument();
      expect(screen.getByText('US/DTS')).toBeInTheDocument();
      expect(screen.getByText('任务详情')).toBeInTheDocument();
      expect(screen.getByText('进度')).toBeInTheDocument();
      expect(screen.getByText('责任人')).toBeInTheDocument();
      expect(screen.getByText('备注')).toBeInTheDocument();
    });

    it('渲染操作机制说明', () => {
      render(<HelpModal opened={true} onClose={onClose} />);

      expect(screen.getByText('复制上周任务')).toBeInTheDocument();
      expect(screen.getByText('进度与时间校验')).toBeInTheDocument();
      expect(screen.getByText('工作量校验')).toBeInTheDocument();
      expect(screen.getByText('权限控制')).toBeInTheDocument();
    });

    it('渲染 AI 分析说明', () => {
      render(<HelpModal opened={true} onClose={onClose} />);

      expect(screen.getByText('功能介绍')).toBeInTheDocument();
      expect(screen.getByText('生成分析')).toBeInTheDocument();
      expect(screen.getByText('重新生成')).toBeInTheDocument();
      expect(screen.getByText('权限说明')).toBeInTheDocument();
      expect(screen.getByText('自定义提示词')).toBeInTheDocument();
    });

    it('渲染亮点功能标签', () => {
      render(<HelpModal opened={true} onClose={onClose} />);

      expect(screen.getByText('亮点功能')).toBeInTheDocument();
    });
  });

  describe('HelpButton', () => {
    it('渲染帮助按钮', () => {
      render(<HelpButton />);

      expect(screen.getByText('❓ 帮助')).toBeInTheDocument();
    });

    it('点击按钮打开模态框', async () => {
      const user = userEvent.setup();
      render(<HelpButton />);

      await user.click(screen.getByText('❓ 帮助'));

      expect(screen.getByText('使用帮助')).toBeInTheDocument();
    });

    it('点击"我知道了"关闭模态框', async () => {
      const user = userEvent.setup();
      render(<HelpButton />);

      await user.click(screen.getByText('❓ 帮助'));
      expect(screen.getByText('使用帮助')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '我知道了' }));

      await waitFor(() => {
        expect(screen.queryByText('使用帮助')).not.toBeInTheDocument();
      });
    });
  });
});
