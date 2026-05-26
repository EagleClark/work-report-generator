import { useState, useCallback, useMemo } from 'react';
import { ActionIcon, Popover, Checkbox, Stack, Button, Group } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

export interface ColumnMeta {
  key: string;
  label: string;
}

export interface ColumnVisibilityResult {
  visibleKeys: string[];
  isVisible: (key: string) => boolean;
  toggleColumn: (key: string) => void;
  showAll: () => void;
  hideAll: () => void;
  ColumnConfigButton: React.ReactElement;
}

export function useColumnVisibility(columns: ColumnMeta[]): ColumnVisibilityResult {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const visibleKeys = useMemo(
    () => columns.map((c) => c.key).filter((k) => !hiddenKeys.has(k)),
    [columns, hiddenKeys],
  );

  const toggleColumn = useCallback(
    (key: string) => {
      setHiddenKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (prev.size >= columns.length - 1) return prev;
          next.add(key);
        }
        return next;
      });
    },
    [columns.length],
  );

  const isVisible = (key: string) => !hiddenKeys.has(key);

  const showAll = useCallback(() => setHiddenKeys(new Set()), []);
  const hideAll = useCallback(() => {
    setHiddenKeys(new Set(columns.slice(1).map((c) => c.key)));
  }, [columns]);

  const ColumnConfigButton = useMemo(
    () => (
      <Popover width={220} position="bottom-end" shadow="md">
        <Popover.Target>
          <ActionIcon variant="subtle" color="gray">
            <IconSettings size={18} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            {columns.map((col) => (
              <Checkbox
                key={col.key}
                label={col.label}
                checked={isVisible(col.key)}
                disabled={isVisible(col.key) && visibleKeys.length <= 1}
                onChange={() => toggleColumn(col.key)}
              />
            ))}
            <Group justify="flex-end" gap="xs" mt="xs">
              <Button size="compact-xs" variant="subtle" onClick={showAll}>
                全选
              </Button>
              <Button size="compact-xs" variant="subtle" onClick={hideAll}>
                最少
              </Button>
            </Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    ),
    [columns, visibleKeys, toggleColumn, showAll, hideAll],
  );

  return { visibleKeys, isVisible, toggleColumn, showAll, hideAll, ColumnConfigButton };
}
