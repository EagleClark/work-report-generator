import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
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

  it('ColumnConfigButton 是一个 React 元素', () => {
    const { result } = renderHook(() => useColumnVisibility(MOCK_COLUMNS));
    expect(result.current.ColumnConfigButton).toBeDefined();
    expect(typeof result.current.ColumnConfigButton).toBe('object');
  });
});
