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
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, guestLogin } = useAuth();
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

  return (
    <Container size={420} my={80}>
      <Title ta="center" mb="lg">
        周报系统
      </Title>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={handleLogin}>
          <Stack gap="md">
            <TextInput
              label="用户名"
              placeholder="请输入用户名"
              required
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
            />

            <PasswordInput
              label="密码"
              placeholder="请输入密码"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}

            <Button type="submit" fullWidth loading={loading}>
              登录
            </Button>
          </Stack>
        </form>

        <Divider label="或者" labelPosition="center" my="lg" />

        <Button fullWidth variant="outline" onClick={handleGuestLogin}>
          游客登录（仅查看周报）
        </Button>
      </Paper>
    </Container>
  );
}