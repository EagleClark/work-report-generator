import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Table,
  Button,
  Modal,
  TextInput,
  PasswordInput,
  Select,
  Group,
  Badge,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { userApi } from '../services/user.api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';
import type { User } from '../types/user';

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: UserRole.USER });
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await userApi.create(formData);
      closeModal();
      setFormData({ username: '', password: '', role: UserRole.USER });
      fetchUsers();
      notifications.show({ title: '成功', message: '用户创建成功', color: 'green' });
    } catch (err: any) {
      notifications.show({
        title: '错误',
        message: err.response?.data?.message || '创建用户失败',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await userApi.delete(deletingUser.id);
      closeDeleteModal();
      setDeletingUser(null);
      fetchUsers();
      notifications.show({ title: '成功', message: '用户删除成功', color: 'green' });
    } catch (err: any) {
      notifications.show({
        title: '错误',
        message: err.response?.data?.message || '删除用户失败',
        color: 'red',
      });
    }
  };

  const getRoleLabel = (role: UserRole) => {
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
        return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'red';
      case UserRole.ADMIN:
        return 'orange';
      case UserRole.USER:
        return 'blue';
      default:
        return 'gray';
    }
  };

  // 判断是否可以创建管理员
  const canCreateAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  return (
    <Container size="xl" py="xl" style={{ minWidth: 1600 }}>
      <Group justify="space-between" mb="md">
        <Title order={1}>用户管理</Title>
        <Button onClick={openModal}>新增用户</Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 80 }}>序号</Table.Th>
            <Table.Th style={{ width: 200 }}>用户名</Table.Th>
            <Table.Th style={{ width: 150 }}>角色</Table.Th>
            <Table.Th>创建时间</Table.Th>
            <Table.Th style={{ width: 100 }}>操作</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user, index) => (
            <Table.Tr key={user.id}>
              <Table.Td>{index + 1}</Table.Td>
              <Table.Td>{user.username}</Table.Td>
              <Table.Td>
                <Badge color={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
              </Table.Td>
              <Table.Td>{new Date(user.createdAt).toLocaleString()}</Table.Td>
              <Table.Td>
                {user.role !== UserRole.SUPER_ADMIN && user.id !== currentUser?.id && (
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="red"
                    onClick={() => handleDeleteClick(user)}
                  >
                    删除
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={modalOpened} onClose={closeModal} title="新增用户">
        <Stack gap="md">
          <TextInput
            label="用户名"
            placeholder="请输入用户名"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.currentTarget.value })}
          />
          <PasswordInput
            label="密码"
            placeholder="请输入密码（至少6位）"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
          />
          <Select
            label="角色"
            data={[
              { value: UserRole.USER, label: '普通用户' },
              ...(canCreateAdmin ? [{ value: UserRole.ADMIN, label: '管理员' }] : []),
            ]}
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as UserRole })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleCreate} loading={loading}>
              创建
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="确认删除">
        <Stack>
          <Text>确定要删除用户 <strong>{deletingUser?.username}</strong> 吗？</Text>
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={closeDeleteModal}>取消</Button>
            <Button color="red" onClick={handleDeleteConfirm}>确认删除</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}