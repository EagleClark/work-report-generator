import { useState, useEffect } from 'react';
import { Table, Group, Button, NumberInput, Modal, Badge, Text, TextInput, ScrollArea, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { taskApi } from '../../services/task.api';
import { userApi } from '../../services/user.api';
import { projectApi, type Project } from '../../services/project.api';
import type { Task, CreateTaskDto } from '../../types/task';
import type { User } from '../../types/user';
import { TaskForm } from '../TaskForm/TaskForm';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

interface TaskTableProps {
  refreshTrigger?: number;
  onDataChange?: (count: number) => void;
}

export function TaskTable({ refreshTrigger, onDataChange }: TaskTableProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState<number | string>('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { user, hasRole } = useAuth();

  // 检查是否有权限操作该任务（管理员可操作所有，普通用户只能操作自己的）
  const canOperateTask = (task: Task): boolean => {
    if (!user) return false;
    if (hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])) return true;
    return String(task.userId) === String(user.id);
  };

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

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (error) {
      // Silent fail
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchProjects();
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

  // Filter tasks by project and assignee
  const filteredTasks = tasks.filter((task) => {
    const matchProject = !projectFilter || task.project.toLowerCase().includes(projectFilter.toLowerCase());
    const matchAssignee = !assigneeFilter || (task.assignee && task.assignee.toLowerCase().includes(assigneeFilter.toLowerCase()));
    return matchProject && matchAssignee;
  });

  // 渲染US/DTS，支持链接
  const renderUsDts = (task: Task) => {
    if (!task.usDts) {
      return <Text c="dimmed">NA</Text>;
    }
    if (task.usDtsLink && task.usDtsLink.match(/^https?:\/\/.+/)) {
      return (
        <Text
          component="a"
          href={task.usDtsLink}
          target="_blank"
          rel="noopener noreferrer"
          c="blue"
          style={{ cursor: 'pointer' }}
        >
          {task.usDts}
        </Text>
      );
    }
    return <Text>{task.usDts}</Text>;
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
        <TextInput
          label="项目筛选"
          placeholder="输入项目名称"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{ width: 150 }}
        />
        <TextInput
          label="责任人筛选"
          placeholder="输入责任人"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{ width: 150 }}
        />
        <Button onClick={handleSearch} loading={loading}>
          查询
        </Button>
        <Button onClick={openCreateModal}>
          新增任务
        </Button>
      </Group>

      <Group mb="sm">
        <Text size="sm" c="dimmed">工作量单位：人天</Text>
      </Group>
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 100 }}>项目</Table.Th>
              <Table.Th style={{ width: 200 }}>US/DTS</Table.Th>
              <Table.Th style={{ width: 350 }}>任务详情</Table.Th>
              <Table.Th style={{ width: 90 }}>进度</Table.Th>
              <Table.Th style={{ width: 90 }}>预计</Table.Th>
              <Table.Th style={{ width: 90 }}>实际</Table.Th>
              <Table.Th style={{ width: 90 }}>本周</Table.Th>
              <Table.Th style={{ width: 200 }}>计划时间</Table.Th>
              <Table.Th style={{ width: 200 }}>实际时间</Table.Th>
              <Table.Th style={{ width: 90 }}>责任人</Table.Th>
              <Table.Th style={{ width: 100 }}>备注</Table.Th>
              <Table.Th style={{ width: 100 }}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredTasks.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={12}>
                  <Text c="dimmed" ta="center">暂无数据</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredTasks.map((task) => (
                <Table.Tr key={task.id}>
                  <Table.Td>{task.project}</Table.Td>
                  <Table.Td style={{ width: 200 }}>{renderUsDts(task)}</Table.Td>
                  <Table.Td style={{ maxWidth: 350 }}>
                    <Tooltip
                      label={task.taskDetail}
                      multiline
                      maw={400}
                      styles={{ tooltip: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
                    >
                      <Text lineClamp={2} style={{ maxWidth: 350 }}>{task.taskDetail}</Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td style={{ width: 90 }}>
                    <Badge color={getProgressColor(task.progress)}>
                      {task.progress}%
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.estimatedWorkload || '-'}</Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.actualWorkload || '-'}</Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.weeklyWorkload || '-'}</Table.Td>
                  <Table.Td style={{ width: 200 }}>
                    <Text size="xs">
                      {task.plannedStartDate || '-'} ~ {task.plannedEndDate || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ width: 200 }}>
                    <Text size="xs">
                      {task.actualStartDate || '-'} ~ {task.actualEndDate || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.assignee || '-'}</Table.Td>
                  <Table.Td style={{ width: 100 }}>
                    {task.remark ? (
                      <Tooltip
                        label={task.remark}
                        multiline
                        maw={300}
                        styles={{ tooltip: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
                      >
                        <span style={{ display: 'inline-block', cursor: 'pointer' }}>
                          <Text lineClamp={2} style={{ maxWidth: 100 }}>{task.remark}</Text>
                        </span>
                      </Tooltip>
                    ) : (
                      <Text c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td style={{ width: 100 }}>
                    {canOperateTask(task) ? (
                      <Group gap={4} wrap="nowrap">
                        <Button size="compact-xs" variant="light" onClick={() => openEditModal(task)}>
                          编辑
                        </Button>
                        <Button size="compact-xs" variant="light" color="red" onClick={() => handleDeleteClick(task.id)}>
                          删除
                        </Button>
                      </Group>
                    ) : (
                      <Text c="dimmed" size="xs">-</Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

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
          currentUser={user}
          users={users}
          projects={projects}
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