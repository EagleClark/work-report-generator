import { AppShell, Group, Button, Title, ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');
  const menuRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 120,
      });
    }
  }, [colorScheme]);

  const getThemeIcon = () => {
    if (colorScheme === 'dark') return '🌙';
    if (colorScheme === 'light') return '☀️';
    return '🔄';
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>周报系统</Title>
          <Group>
            <Button
              variant={location.pathname === '/' ? 'filled' : 'subtle'}
              component={Link}
              to="/"
            >
              任务管理
            </Button>
            <Button
              variant={location.pathname === '/weekly-report' ? 'filled' : 'subtle'}
              component={Link}
              to="/weekly-report"
            >
              周报汇总
            </Button>
            <Menu shadow="md" width={140} position="bottom-end" withArrow>
              <Menu.Target>
                <ActionIcon 
                  ref={menuRef}
                  variant="subtle" 
                  size="lg" 
                  aria-label="主题设置"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {getThemeIcon()}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>主题</Menu.Label>
                <Menu.Item 
                  onClick={() => setColorScheme('light')}
                  rightSection={colorScheme === 'light' ? '✓' : null}
                >
                  ☀️ 浅色
                </Menu.Item>
                <Menu.Item 
                  onClick={() => setColorScheme('dark')}
                  rightSection={colorScheme === 'dark' ? '✓' : null}
                >
                  🌙 深色
                </Menu.Item>
                <Menu.Item 
                  onClick={() => setColorScheme('auto')}
                  rightSection={colorScheme === 'auto' ? '✓' : null}
                >
                  🔄 跟随系统
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
