import { useState, useEffect } from 'react';
import { Table, Group, Button, NumberInput, Modal, Badge, Text, Progress } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { taskApi } from '../../services/task.api';
import type { Task, CreateTaskDto } from '../../types/task';
import { TaskForm } from '../TaskForm/TaskForm';

interface TaskTableProps {
  refreshTrigger?: number;
  onDataChange?: (count: number) => void;
}

export function TaskTable({ refreshTrigger, onDataChange }: TaskTableProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const query: Record<string, number> = { year };
      if (weekNumber) {
        query.weekNumber = Number(weekNumber);
      }
      const data = await taskApi.getAll(query);
      setTasks(data);
      onDataChange?.(data.length);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const handleSearch = () => {
    fetchTasks();
  };

  const handleCreate = async (dto: CreateTaskDto) => {
    await taskApi.create(dto);
    closeModal();
    fetchTasks();
  };

  const handleUpdate = async (dto: CreateTaskDto) => {
    if (!editingTask) {
      return;
    }
    await taskApi.update(editingTask.id, dto);
    setEditingTask(null);
    closeModal();
    fetchTasks();
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await taskApi.delete(deletingId);
      closeDeleteModal();
      setDeletingId(null);
      fetchTasks();
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    openModal();
  };

  const openCreateModal = () => {
    setEditingTask(null);
    openModal();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'green';
    if (progress >= 50) return 'yellow';
    if (progress > 0) return 'blue';
    return 'gray';
  };

  return (
    <div>
      <Group mb="md" align="flex-end">
        <NumberInput
          label="年份"
          value={year}
          onChange={(val) => setYear(Number(val))}
          min={2000}
          max={2100}
          style={{ width: 120 }}
        />
        <NumberInput
          label="周数"
          placeholder="全部"
          description={weekNumber ? getWeekDateRange(year, Number(weekNumber)) : ''}
          value={weekNumber}
          onChange={(val) => setWeekNumber(val)}
          min={1}
          max={53}
          style={{ width: 120 }}
        />
        <Button onClick={handleSearch} loading={loading}>
          查询
        </Button>
        <Button onClick={openCreateModal}>
          新增任务
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>项目</Table.Th>
            <Table.Th>US/DTS</Table.Th>
            <Table.Th>任务详情</Table.Th>
            <Table.Th>进度</Table.Th>
            <Table.Th>预计工作量</Table.Th>
            <Table.Th>实际工作量</Table.Th>
            <Table.Th>本周工作量</Table.Th>
            <Table.Th>周数</Table.Th>
            <Table.Th>操作</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tasks.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={9}>
                <Text c="dimmed" ta="center">暂无数据</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            tasks.map((task) => (
              <Table.Tr key={task.id}>
                <Table.Td>{task.id}</Table.Td>
                <Table.Td>{task.project}</Table.Td>
                <Table.Td>{task.usDts || '-'}</Table.Td>
                <Table.Td>
                  <Text lineClamp={2}>{task.taskDetail}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Progress
                      value={task.progress}
                      color={getProgressColor(task.progress)}
                      size="sm"
                      style={{ width: 60 }}
                    />
                    <Text size="xs">{task.progress}%</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{task.estimatedWorkload || '-'} 人天</Table.Td>
                <Table.Td>{task.actualWorkload || '-'} 人天</Table.Td>
                <Table.Td>{task.weeklyWorkload || '-'} 人天</Table.Td>
                <Table.Td>
                  <Badge>第{task.weekNumber}周</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="subtle" onClick={() => openEditModal(task)}>
                      编辑
                    </Button>
                    <Button size="xs" variant="subtle" color="red" onClick={() => handleDeleteClick(task.id)}>
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
        title={editingTask ? '编辑任务' : '新增任务'}
        size="xl"
      >
        <TaskForm
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onCancel={closeModal}
          initialData={editingTask || undefined}
          isEdit={!!editingTask}
        />
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="确认删除"
      >
        <Text>确定要删除这条任务吗？</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>取消</Button>
          <Button color="red" onClick={handleDeleteConfirm}>确认删除</Button>
        </Group>
      </Modal>
    </div>
  );
}

function getWeekDateRange(year: number, week: number): string {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const weekStart = simple;
  if (dow <= 4) {
    weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    weekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const formatDate = (d: Date) => {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}月${day}日`;
  };
  
  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
}
