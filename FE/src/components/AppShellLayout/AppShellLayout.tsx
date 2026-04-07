import { AppShell, Group, Button, Title, ActionIcon, Menu, useMantineColorScheme, Avatar, Text, Box, Modal, PasswordInput, Stack, NumberInput, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../../context/AuthContext';
import { useWeek, getWeekDateRange } from '../../context/WeekContext';
import { UserRole } from '../../types/user';
import { authApi } from '../../services/auth.api';
import { HelpModal } from '../HelpModal/HelpModal';

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const { user, logout, isAuthenticated, hasRole } = useAuth();
  const { year, weekNumber, setYear, setWeekNumber } = useWeek();
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');
  const menuRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);
  const [helpModalOpened, { open: openHelpModal, close: closeHelpModal }] = useDisclosure(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return '超级管理员';
      case UserRole.ADMIN:
        return '管理员';
      case UserRole.USER:
        return '普通用户';
      case UserRole.GUEST:
        return '游客';
      default:
        return '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/login?year=${year}&week=${weekNumber}`);
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      setPasswordError('请填写所有字段');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('新密码至少6位');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    try {
      await authApi.changePassword(oldPassword, newPassword);
      closePasswordModal();
      setOldPassword('');
      setNewPassword('');
      notifications.show({
        title: '密码修改成功',
        message: '请使用新密码登录',
        color: 'green',
        withBorder: true,
        autoClose: 5000,
        position: 'top-center',
      });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const canManageUsers = hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const isLoginPage = location.pathname === '/login';

  // 生成带年周参数的链接
  const getLinkWithWeekParams = (path: string): string => {
    return `${path}?year=${year}&week=${weekNumber}`;
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      {!isLoginPage && (
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="md">
              <Title order={3}>周报系统</Title>
              {/* 年份和周数选择器 */}
              <Group gap="xs" align="center">
                <NumberInput
                  value={year}
                  onChange={(val) => setYear(Number(val) || new Date().getFullYear())}
                  min={2000}
                  max={2100}
                  style={{ width: 70 }}
                  size="xs"
                />
                <Text size="sm">年第</Text>
                <NumberInput
                  value={weekNumber}
                  onChange={(val) => setWeekNumber(Number(val) || 1)}
                  min={1}
                  max={53}
                  style={{ width: 50 }}
                  size="xs"
                />
                <Text size="sm">周</Text>
                <Badge variant="filled" color="blue" size="md" fw={600}>
                  {getWeekDateRange(year, weekNumber)}
                </Badge>
              </Group>
            </Group>
            <Group>
            {isAuthenticated && hasRole([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]) && (
              <Button
                variant={location.pathname === '/' ? 'filled' : 'subtle'}
                component={Link}
                to={getLinkWithWeekParams('/')}
              >
                任务管理
              </Button>
            )}
            <Button
              variant={location.pathname === '/weekly-report' ? 'filled' : 'subtle'}
              component={Link}
              to={getLinkWithWeekParams('/weekly-report')}
            >
              周报汇总
            </Button>

            {/* 用户菜单 */}
            {isAuthenticated && user ? (
              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <Button variant="subtle" leftSection={<Avatar size={24} radius="xl" color="blue" />}>
                    <Box>
                      <Text size="sm" fw={500}>{user.username}</Text>
                    </Box>
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{getRoleLabel(user.role)}</Menu.Label>
                  {user.role !== UserRole.GUEST && (
                    <Menu.Item onClick={openPasswordModal}>
                      修改密码
                    </Menu.Item>
                  )}
                  {canManageUsers && (
                    <Menu.Item component={Link} to={getLinkWithWeekParams('/projects')}>
                      项目管理
                    </Menu.Item>
                  )}
                  {canManageUsers && (
                    <Menu.Item component={Link} to={getLinkWithWeekParams('/users')}>
                      用户管理
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={handleLogout}>
                    退出登录
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button variant="subtle" component={Link} to={getLinkWithWeekParams('/login')}>
                登录
              </Button>
            )}

            {/* GitHub仓库链接 */}
            <ActionIcon
              variant="subtle"
              size="lg"
              component="a"
              href="https://github.com/EagleClark/work-report-generator"
              target="_blank"
              aria-label="GitHub仓库"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </ActionIcon>

            {/* 帮助按钮 */}
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={openHelpModal}
              aria-label="帮助"
            >
              ❓
            </ActionIcon>

            {/* 主题菜单 */}
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
      )}

      <AppShell.Main>
        {children}
      </AppShell.Main>

      {/* 修改密码弹窗 */}
      <Modal opened={passwordModalOpened} onClose={closePasswordModal} title="修改密码">
        <Stack gap="md">
          <PasswordInput
            label="原密码"
            placeholder="请输入原密码"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="新密码"
            placeholder="请输入新密码（至少6位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            required
          />
          {passwordError && (
            <Text c="red" size="sm">{passwordError}</Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closePasswordModal}>取消</Button>
            <Button onClick={handlePasswordChange} loading={passwordLoading}>确认修改</Button>
          </Group>
        </Stack>
      </Modal>

      {/* 帮助弹窗 */}
      <HelpModal opened={helpModalOpened} onClose={closeHelpModal} />
    </AppShell>
  );
}