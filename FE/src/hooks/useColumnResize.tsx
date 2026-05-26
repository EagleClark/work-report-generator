import { useState, useCallback, useRef, useEffect } from 'react';

export interface ColumnResizeResult {
  columnWidths: Record<string, number>;
  getThProps: (columnKey: string) => React.ThHTMLAttributes<HTMLTableHeaderCellElement> & {
    style: React.CSSProperties;
  };
  resizeHandle: (columnKey: string) => React.ReactElement;
  resetWidths: () => void;
}

const MIN_COLUMN_WIDTH = 60;

export function useColumnResize(
  defaultWidths: Record<string, number>,
  minWidth: number = MIN_COLUMN_WIDTH,
): ColumnResizeResult {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultWidths);
  const dragState = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const minWidthRef = useRef(minWidth);

  const handleMouseDown = useCallback(
    (columnKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragState.current = {
        columnKey,
        startX: e.clientX,
        startWidth: columnWidths[columnKey] ?? defaultWidths[columnKey] ?? 100,
      };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [columnWidths, defaultWidths],
  );

  minWidthRef.current = minWidth;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const { columnKey, startX, startWidth } = dragState.current;
      const diff = e.clientX - startX;
      const newWidth = Math.max(minWidthRef.current, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      if (!dragState.current) return;
      dragState.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const getThProps = useCallback(
    (columnKey: string) => {
      const width = columnWidths[columnKey] ?? defaultWidths[columnKey] ?? MIN_COLUMN_WIDTH;
      return {
        style: {
          width,
          minWidth: width,
          position: 'relative' as const,
        },
      };
    },
    [columnWidths, defaultWidths],
  );

  const resizeHandle = (columnKey: string) => (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 8,
        cursor: 'col-resize',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => handleMouseDown(columnKey, e)}
    >
      <div
        style={{
          width: 2,
          height: '50%',
          borderRadius: 1,
          backgroundColor: 'var(--mantine-color-gray-4)',
        }}
      />
    </div>
  );

  const resetWidths = useCallback(() => {
    setColumnWidths(defaultWidths);
  }, [defaultWidths]);

  return { columnWidths, getThProps, resizeHandle, resetWidths };
}
