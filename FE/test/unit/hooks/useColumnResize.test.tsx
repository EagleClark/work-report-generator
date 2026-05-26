import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useColumnResize } from '@/hooks/useColumnResize';

const DEFAULT_WIDTHS = { colA: 100, colB: 200 };

function TestComponent({ defaultWidths, minWidth }: {
  defaultWidths: Record<string, number>;
  minWidth?: number;
}) {
  const { columnWidths, getThProps, resizeHandle, resetWidths } = minWidth
    ? useColumnResize(defaultWidths, minWidth)
    : useColumnResize(defaultWidths);

  return (
    <table>
      <thead>
        <tr>
          <th data-testid="th-colA" {...getThProps('colA')}>
            ColA
            {resizeHandle('colA')}
          </th>
          <th data-testid="th-colB" {...getThProps('colB')}>
            ColB
            {resizeHandle('colB')}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-testid="width-colA">{columnWidths.colA}</td>
          <td data-testid="width-colB">{columnWidths.colB}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <button data-testid="reset-btn" onClick={resetWidths}>
              重置
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function renderHook(defaults = DEFAULT_WIDTHS, minW?: number) {
  return render(<TestComponent defaultWidths={defaults} minWidth={minW} />);
}

describe('useColumnResize', () => {
  beforeEach(() => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });

  describe('初始状态', () => {
    it('使用默认宽度初始化', () => {
      renderHook();
      expect(screen.getByTestId('width-colA').textContent).toBe('100');
      expect(screen.getByTestId('width-colB').textContent).toBe('200');
    });

    it('getThProps 返回正确的 style', () => {
      renderHook();
      const th = screen.getByTestId('th-colA');
      expect(th.style.width).toBe('100px');
      expect(th.style.position).toBe('relative');
    });

    it('resizeHandle 渲染可拖拽元素', () => {
      renderHook();
      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div');
      expect(handle).not.toBeNull();
      expect(handle!.style.cursor).toBe('col-resize');
      expect(handle!.style.width).toBe('8px');
      expect(handle!.style.position).toBe('absolute');
      expect(handle!.style.right).toBe('0px');
    });
  });

  describe('拖动调整宽度', () => {
    it('向右拖动增大列宽', async () => {
      const user = userEvent.setup();
      renderHook();

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;
      const startWidth = parseInt(screen.getByTestId('width-colA').textContent!);

      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: 50, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(startWidth + 50);
    });

    it('向左拖动减小列宽', async () => {
      const user = userEvent.setup();
      renderHook();

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;

      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: -30, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(70);
    });

    it('不拖到小于 minWidth', async () => {
      const user = userEvent.setup();
      renderHook();

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;

      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: -200, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(60);
    });

    it('可自定义 minWidth', async () => {
      const user = userEvent.setup();
      renderHook(DEFAULT_WIDTHS, 40);

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;

      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: -200, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);

      const newWidth = parseInt(screen.getByTestId('width-colA').textContent!);
      expect(newWidth).toBe(40);
    });
  });

  describe('resetWidths', () => {
    it('重置为默认宽度', async () => {
      const user = userEvent.setup();
      renderHook();

      const th = screen.getByTestId('th-colA');
      const handle = th.querySelector('div')!;
      await user.pointer([
        { keys: '[MouseLeft>]', target: handle, coords: { x: 0, y: 0 } },
        { target: handle, coords: { x: 50, y: 0 } },
        { keys: '[/MouseLeft]' },
      ]);
      expect(screen.getByTestId('width-colA').textContent).not.toBe('100');

      await user.click(screen.getByTestId('reset-btn'));
      expect(screen.getByTestId('width-colA').textContent).toBe('100');
      expect(screen.getByTestId('width-colB').textContent).toBe('200');
    });
  });

  describe('getThProps 缺失 key 回退', () => {
    it('未知 columnKey 返回 MIN_COLUMN_WIDTH', () => {
      const TestMissingKey = () => {
        const { getThProps } = useColumnResize(DEFAULT_WIDTHS);
        const props = getThProps('nonexistent');
        return <div data-testid="fallback">{props.style.width}</div>;
      };
      render(<TestMissingKey />);
      expect(screen.getByTestId('fallback').textContent).toBe('60');
    });
  });
});
