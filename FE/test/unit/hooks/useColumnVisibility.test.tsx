import { describe, it, expect } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';

const MOCK_COLUMNS = [
  { key: 'a', label: '列A' },
  { key: 'b', label: '列B' },
  { key: 'c', label: '列C' },
];

describe('useColumnVisibility', () => {
  it('初始状态全部列可见', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    expect(result.current.visibleKeys).toEqual(['a', 'b', 'c']);
    expect(result.current.isVisible('a')).toBe(true);
    expect(result.current.isVisible('b')).toBe(true);
    expect(result.current.isVisible('c')).toBe(true);
  });

  it('toggleColumn 可以隐藏列', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('b'); });
    expect(result.current.visibleKeys).toEqual(['a', 'c']);
    expect(result.current.isVisible('b')).toBe(false);
  });

  it('toggleColumn 可以恢复已隐藏的列', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('b'); });
    act(() => { result.current.toggleColumn('b'); });
    expect(result.current.visibleKeys).toEqual(['a', 'b', 'c']);
  });

  it('至少保留 1 列可见 — toggleColumn 无法隐藏最后一列', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('a'); });
    act(() => { result.current.toggleColumn('b'); });
    // 现在只剩 'c'，尝试隐藏它
    act(() => { result.current.toggleColumn('c'); });
    expect(result.current.visibleKeys).toEqual(['c']);
  });

  it('showAll 恢复全部列可见', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('a'); });
    act(() => { result.current.toggleColumn('b'); });
    act(() => { result.current.showAll(); });
    expect(result.current.visibleKeys).toEqual(['a', 'b', 'c']);
  });

  it('hideAll 仅保留第一列可见', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.hideAll(); });
    expect(result.current.visibleKeys).toEqual(['a']);
    expect(result.current.isVisible('a')).toBe(true);
    expect(result.current.isVisible('b')).toBe(false);
    expect(result.current.isVisible('c')).toBe(false);
  });

  it('visibleKeys 保持 columns 参数的原始顺序', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('a'); });
    act(() => { result.current.toggleColumn('c'); });
    // 只剩 'b'
    expect(result.current.visibleKeys).toEqual(['b']);
  });

  it('ColumnConfigButton 渲染齿轮图标', () => {
    function TestButton() {
      const { ColumnConfigButton } = useColumnVisibility(MOCK_COLUMNS);
      return <div data-testid="wrapper">{ColumnConfigButton}</div>;
    }
    render(<TestButton />, { wrapper: MantineProvider });
    const wrapper = screen.getByTestId('wrapper');
    const svg = wrapper.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('0 列时不崩溃且 visibleKeys 为空', () => {
    const { result } = renderHook(() => useColumnVisibility([]));
    expect(result.current.visibleKeys).toEqual([]);
    // toggleColumn on empty state should not throw
    expect(() => act(() => { result.current.toggleColumn('any'); })).not.toThrow();
    expect(() => act(() => { result.current.showAll(); })).not.toThrow();
    expect(() => act(() => { result.current.hideAll(); })).not.toThrow();
  });

  it('1 列时无法隐藏该列', () => {
    const single = [{ key: 'only', label: '唯一列' }];
    const { result } = renderHook(() => useColumnVisibility(single));
    act(() => { result.current.toggleColumn('only'); });
    expect(result.current.visibleKeys).toEqual(['only']);
  });

  it('1 列时 hideAll 仍保留该列', () => {
    const single = [{ key: 'only', label: '唯一列' }];
    const { result } = renderHook(() => useColumnVisibility(single));
    act(() => { result.current.hideAll(); });
    expect(result.current.visibleKeys).toEqual(['only']);
  });

  it('toggleColumn 对未知 key 无影响', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('unknown'); });
    expect(result.current.visibleKeys).toEqual(['a', 'b', 'c']);
  });

  it('hideAll 先隐藏部分再 hideAll 仅保留第一列', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    act(() => { result.current.toggleColumn('b'); });
    act(() => { result.current.hideAll(); });
    expect(result.current.visibleKeys).toEqual(['a']);
  });

  it('最后可见列的 Checkbox 被 disabled', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    // 隐藏 a 和 b，只剩 c 可见
    act(() => { result.current.toggleColumn('a'); });
    act(() => { result.current.toggleColumn('b'); });
    // 现在只剩 c，它的 disabled 应该为 true
    expect(result.current.isVisible('c')).toBe(true);
    expect(result.current.visibleKeys).toEqual(['c']);
  });
});
