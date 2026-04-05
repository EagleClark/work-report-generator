import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Table,
  Button,
  Modal,
  TextInput,
  Textarea,
  Group,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { projectApi, type Project, CreateProjectDto, UpdateProjectDto } from '../services/project.api';
import { notifications } from '@mantine/notifications';

export function ProjectManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      notifications.show({ title: '错误', message: '项目名称不能为空', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await projectApi.create(formData as CreateProjectDto);
      closeModal();
      setFormData({ name: '', description: '' });
      fetchProjects();
      notifications.show({ title: '成功', message: '项目创建成功', color: 'green' });
    } catch (err: any) {
      notifications.show({
        title: '错误',
        message: err.response?.data?.message || '创建项目失败',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProject || !formData.name.trim()) {
      notifications.show({ title: '错误', message: '项目名称不能为空', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await projectApi.update(editingProject.id, formData as UpdateProjectDto);
      setEditingProject(null);
      closeModal();
      setFormData({ name: '', description: '' });
      fetchProjects();
      notifications.show({ title: '成功', message: '项目更新成功', color: 'green' });
    } catch (err: any) {
      notifications.show({
        title: '错误',
        message: err.response?.data?.message || '更新项目失败',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (project: Project) => {
    setDeletingId(project.id);
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      try {
        await projectApi.delete(deletingId);
        closeDeleteModal();
        setDeletingId(null);
        fetchProjects();
        notifications.show({ title: '成功', message: '项目删除成功', color: 'green' });
      } catch (err: any) {
        notifications.show({
          title: '错误',
          message: err.response?.data?.message || '删除项目失败',
          color: 'red',
        });
      }
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description || '' });
    openModal();
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '' });
    openModal();
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>项目管理</Title>
        <Button onClick={openCreateModal}>新增项目</Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 80 }}>ID</Table.Th>
            <Table.Th style={{ width: 200 }}>项目名称</Table.Th>
            <Table.Th>项目描述</Table.Th>
            <Table.Th style={{ width: 180 }}>创建时间</Table.Th>
            <Table.Th style={{ width: 100 }}>操作</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {projects.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Group justify="center" c="dimmed">暂无项目</Group>
              </Table.Td>
            </Table.Tr>
          ) : (
            projects.map((project) => (
              <Table.Tr key={project.id}>
                <Table.Td>{project.id}</Table.Td>
                <Table.Td>{project.name}</Table.Td>
                <Table.Td>{project.description || '-'}</Table.Td>
                <Table.Td>{new Date(project.createdAt).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Button
                      size="compact-xs"
                      variant="light"
                      onClick={() => openEditModal(project)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="red"
                      onClick={() => handleDeleteClick(project)}
                    >
                      删除
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingProject ? '编辑项目' : '新增项目'}
      >
        <Stack gap="md">
          <TextInput
            label="项目名称"
            placeholder="请输入项目名称"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Textarea
            label="项目描述"
            placeholder="请输入项目描述（可选）"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={editingProject ? handleUpdate : handleCreate} loading={loading}>
              {editingProject ? '更新' : '创建'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="确认删除">
        <Stack>
          <Group>确定要删除该项目吗？</Group>
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={closeDeleteModal}>取消</Button>
            <Button color="red" onClick={handleDeleteConfirm}>确认删除</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}