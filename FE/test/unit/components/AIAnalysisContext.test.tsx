import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { AIAnalysisProvider, useAIAnalysisState } from '@/context/AIAnalysisContext';

function TestConsumer() {
  const { localStreamContent, setLocalStreamContent, appendLocalStreamContent } =
    useAIAnalysisState();

  return (
    <div>
      <span data-testid="content">{localStreamContent}</span>
      <button data-testid="append-btn" onClick={() => appendLocalStreamContent('chunk')}>
        Append
      </button>
      <button data-testid="append-btn-2" onClick={() => appendLocalStreamContent('-more')}>
        AppendMore
      </button>
      <button data-testid="set-btn" onClick={() => setLocalStreamContent('replaced')}>
        Set
      </button>
    </div>
  );
}

describe('AIAnalysisContext', () => {
  it('渲染子组件', () => {
    render(
      <AIAnalysisProvider>
        <div data-testid="child">子组件</div>
      </AIAnalysisProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('子组件')).toBeInTheDocument();
  });

  it('初始提供空字符串的 localStreamContent', () => {
    render(
      <AIAnalysisProvider>
        <TestConsumer />
      </AIAnalysisProvider>,
    );

    expect(screen.getByTestId('content').textContent).toBe('');
  });

  it('appendLocalStreamContent 拼接内容', async () => {
    const user = userEvent.setup();
    render(
      <AIAnalysisProvider>
        <TestConsumer />
      </AIAnalysisProvider>,
    );

    await user.click(screen.getByTestId('append-btn'));
    expect(screen.getByTestId('content').textContent).toBe('chunk');

    await user.click(screen.getByTestId('append-btn-2'));
    expect(screen.getByTestId('content').textContent).toBe('chunk-more');
  });

  it('setLocalStreamContent 替换内容', async () => {
    const user = userEvent.setup();
    render(
      <AIAnalysisProvider>
        <TestConsumer />
      </AIAnalysisProvider>,
    );

    await user.click(screen.getByTestId('append-btn'));
    expect(screen.getByTestId('content').textContent).toBe('chunk');

    await user.click(screen.getByTestId('set-btn'));
    expect(screen.getByTestId('content').textContent).toBe('replaced');
  });

  it('在 Provider 外使用 useAIAnalysisState 抛错', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAIAnalysisState must be used within an AIAnalysisProvider',
    );
    consoleSpy.mockRestore();
  });
});
