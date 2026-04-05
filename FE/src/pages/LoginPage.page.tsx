import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Stack,
  Divider,
  ActionIcon,
  Menu,
  Box,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import classes from './LoginPage.module.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, guestLogin } = useAuth();
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    guestLogin();
    navigate('/weekly-report');
  };

  const getThemeIcon = () => {
    if (colorScheme === 'dark') return '🌙';
    if (colorScheme === 'light') return '☀️';
    return '🔄';
  };

  return (
    <Box className={classes.wrapper}>
      {/* 背景装饰 */}
      <div className={classes.background}>
        <div className={classes.blob1} />
        <div className={classes.blob2} />
        <div className={classes.blob3} />
        <div className={classes.grid} />
      </div>

      {/* 顶部主题切换 - 固定在右上角 */}
      <Box className={classes.themeToggle}>
        <Menu shadow="md" width={140} position="bottom-end" withArrow>
          <Menu.Target>
            <ActionIcon variant="light" size="lg" aria-label="主题设置" radius="xl">
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
      </Box>

      <Container size={420} className={classes.container}>
        <Title ta="center" className={classes.title}>
          周报系统
        </Title>
        <Text ta="center" className={classes.subtitle}>
          高效管理每周工作
        </Text>

        <Paper className={classes.card} shadow="xl" radius="xl" p="xl">
          <form onSubmit={handleLogin}>
            <Stack gap="md">
              <TextInput
                label="用户名"
                placeholder="请输入用户名"
                required
                size="md"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                classNames={{ input: classes.input }}
              />

              <PasswordInput
                label="密码"
                placeholder="请输入密码"
                required
                size="md"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                classNames={{ input: classes.input }}
              />

              {error && (
                <Text c="red" size="sm">
                  {error}
                </Text>
              )}

              <Button type="submit" fullWidth size="md" mt="md" className={classes.button}>
                登录
              </Button>
            </Stack>
          </form>

          <Divider label="或者" labelPosition="center" my="lg" />

          <Button fullWidth variant="light" size="md" onClick={handleGuestLogin}>
            游客登录（仅查看周报）
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}