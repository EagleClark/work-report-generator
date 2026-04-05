import { AppShell, Group, Button, Title, ActionIcon, Menu, useMantineColorScheme, Avatar, Text, Box, Modal, PasswordInput, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import { authApi } from '../../services/auth.api';

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const { user, logout, isAuthenticated, hasRole } = useAuth();
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');
  const menuRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);
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
    navigate('/login');
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

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>周报系统</Title>
          <Group>
            {isAuthenticated && hasRole([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]) && (
              <Button
                variant={location.pathname === '/' ? 'filled' : 'subtle'}
                component={Link}
                to="/"
              >
                任务管理
              </Button>
            )}
            <Button
              variant={location.pathname === '/weekly-report' ? 'filled' : 'subtle'}
              component={Link}
              to="/weekly-report"
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
                    <Menu.Item component={Link} to="/projects">
                      项目管理
                    </Menu.Item>
                  )}
                  {canManageUsers && (
                    <Menu.Item component={Link} to="/users">
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
              <Button variant="subtle" component={Link} to="/login">
                登录
              </Button>
            )}

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
    </AppShell>
  );
}