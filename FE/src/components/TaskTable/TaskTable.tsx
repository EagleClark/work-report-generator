import { useState, useEffect, useMemo } from 'react';
import { Table, Group, Button, Modal, Badge, Text, ScrollArea, Tooltip, Select, Paper, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { taskApi } from '../../services/task.api';
import { userApi } from '../../services/user.api';
import { projectApi, type Project } from '../../services/project.api';
import type { Task, CreateTaskDto } from '../../types/task';
import type { User } from '../../types/user';
import { TaskForm } from '../TaskForm/TaskForm';
import { CopyTaskModal } from '../CopyTaskModal/CopyTaskModal';
import { useAuth } from '../../context/AuthContext';
import { useWeek } from '../../context/WeekContext';
import { UserRole } from '../../types/user';

interface TaskTableProps {
  refreshTrigger?: number;
  onDataChange?: (count: number) => void;
}

export function TaskTable({ refreshTrigger, onDataChange }: TaskTableProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const { year, weekNumber } = useWeek();
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [copyModalOpened, { open: openCopyModal, close: closeCopyModal }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { user, hasRole } = useAuth();

  // 检查是否有权限操作该任务（管理员可操作所有，普通用户只能操作自己的）
  const canOperateTask = (task: Task): boolean => {
    if (!user) return false;
    if (hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])) return true;
    // 检查 userId 或 assignee 匹配
    const userIdMatch = task.userId && String(task.userId) === String(user.id);
    const assigneeMatch = task.assignee === user.username;
    return userIdMatch || assigneeMatch;
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const query: Record<string, number> = { year, weekNumber };
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
  }, [refreshTrigger, year, weekNumber]);

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

  // 进度颜色：0%灰色(未开始)，1-24%红色，25-49%橙色，50-74%黄色，75-99%蓝色，100%绿色
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'green';
    if (progress >= 75) return 'blue';
    if (progress >= 50) return 'yellow';
    if (progress >= 25) return 'orange';
    if (progress > 0) return 'red';
    return 'gray';
  };

  // Filter tasks by project and assignee
  const filteredTasks = tasks.filter((task) => {
    const matchProject = !projectFilter || task.project === projectFilter;
    const matchAssignee = !assigneeFilter || task.assignee === assigneeFilter;
    return matchProject && matchAssignee;
  });

  // 排序状态
  type SortField = 'project' | 'assignee' | null;
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 排序切换
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 排序后的任务列表
  const sortedTasks = useMemo(() => {
    if (!sortField) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const aValue = sortField === 'project' ? a.project : (a.assignee || '未分配');
      const bValue = sortField === 'project' ? b.project : (b.assignee || '未分配');
      const cmp = aValue.localeCompare(bValue, 'zh-CN');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredTasks, sortField, sortDirection]);

  // 按责任人统计本周工作量和本周实际工作量
  const assigneeStats = useMemo(() => {
    const statsMap = new Map<string, { planned: number; actual: number }>();

    filteredTasks.forEach(task => {
      const assignee = task.assignee || '未分配';
      if (!statsMap.has(assignee)) {
        statsMap.set(assignee, { planned: 0, actual: 0 });
      }
      const stats = statsMap.get(assignee)!;
      stats.planned += task.plannedWeeklyWorkload || 0;
      stats.actual += task.weeklyWorkload || 0;
    });

    return Array.from(statsMap.entries())
      .map(([assignee, stats]) => ({
        assignee,
        plannedWeeklyWorkload: stats.planned,
        weeklyWorkload: stats.actual,
      }))
      .sort((a, b) => a.assignee.localeCompare(b.assignee));
  }, [filteredTasks]);

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

  // 生成项目下拉选项
  const projectOptions = projects.map(p => ({ value: p.name, label: p.name }));

  // 生成责任人下拉选项（排除超管，确保当前用户在选项中）
  const assigneeOptions = users
    .filter(u => u.role !== UserRole.SUPER_ADMIN)
    .map(u => ({ value: u.username, label: u.username }));

  // 如果当前用户不在选项中，添加进去
  if (user?.username && user.role !== UserRole.SUPER_ADMIN) {
    if (!assigneeOptions.some(opt => opt.value === user.username)) {
      assigneeOptions.push({ value: user.username, label: user.username });
    }
  }

  return (
    <div>
      <Group mb="md" align="flex-end">
        <Select
          label="项目筛选"
          placeholder="全部项目"
          data={projectOptions}
          value={projectFilter}
          onChange={(value) => setProjectFilter(value)}
          clearable
          searchable
          style={{ width: 160 }}
        />
        <Select
          label="责任人筛选"
          placeholder="全部责任人"
          data={assigneeOptions}
          value={assigneeFilter}
          onChange={(value) => setAssigneeFilter(value)}
          clearable
          searchable
          style={{ width: 160 }}
        />
        <Button onClick={openCreateModal}>
          新增任务
        </Button>
        <Button color="orange" onClick={openCopyModal}>
          复制上周任务
        </Button>
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover style={{ minWidth: 1680 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 100 }}>
                <Group gap={4} wrap="nowrap">
                  项目
                  <ActionIcon size="xs" variant={sortField === 'project' ? 'filled' : 'subtle'} onClick={() => handleSort('project')}>
                    {sortField === 'project' && sortDirection === 'desc' ? '▼' : '▲'}
                  </ActionIcon>
                </Group>
              </Table.Th>
              <Table.Th style={{ width: 190 }}>US/DTS</Table.Th>
              <Table.Th style={{ width: 300 }}>任务详情</Table.Th>
              <Table.Th style={{ width: 90 }}>进度</Table.Th>
              <Table.Th style={{ width: 90 }}>预计</Table.Th>
              <Table.Th style={{ width: 90 }}>实际</Table.Th>
              <Table.Th style={{ width: 90 }}>本周计划</Table.Th>
              <Table.Th style={{ width: 90 }}>本周实际</Table.Th>
              <Table.Th style={{ width: 170 }}>计划时间</Table.Th>
              <Table.Th style={{ width: 170 }}>实际时间</Table.Th>
              <Table.Th style={{ width: 90 }}>
                <Group gap={4} wrap="nowrap">
                  责任人
                  <ActionIcon size="xs" variant={sortField === 'assignee' ? 'filled' : 'subtle'} onClick={() => handleSort('assignee')}>
                    {sortField === 'assignee' && sortDirection === 'desc' ? '▼' : '▲'}
                  </ActionIcon>
                </Group>
              </Table.Th>
              <Table.Th style={{ width: 110 }}>备注</Table.Th>
              <Table.Th style={{ width: 100 }}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedTasks.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={13}>
                  <Text c="dimmed" ta="center">暂无数据</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              sortedTasks.map((task) => (
                <Table.Tr key={task.id}>
                  <Table.Td style={{ width: 100 }}>
                    <Tooltip
                      label={task.project}
                      disabled={task.project.length <= 10}
                    >
                      <Text
                        lineClamp={1}
                        style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {task.project}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td style={{ width: 190 }}>{renderUsDts(task)}</Table.Td>
                  <Table.Td style={{ width: 300 }}>
                    <Tooltip
                      label={task.taskDetail}
                      multiline
                      maw={400}
                      styles={{ tooltip: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
                    >
                      <Text lineClamp={2} style={{ maxWidth: 300 }}>{task.taskDetail}</Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td style={{ width: 90 }}>
                    <Badge color={getProgressColor(task.progress)}>
                      {task.progress}%
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.estimatedWorkload || '-'}</Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.actualWorkload || '-'}</Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.plannedWeeklyWorkload || '-'}</Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.weeklyWorkload || '-'}</Table.Td>
                  <Table.Td style={{ width: 170 }}>
                    <Text size="xs">
                      {task.plannedStartDate || '-'} ~ {task.plannedEndDate || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ width: 170 }}>
                    <Text size="xs">
                      {task.actualStartDate || '-'} ~ {task.actualEndDate || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ width: 90 }}>{task.assignee || '-'}</Table.Td>
                  <Table.Td style={{ width: 110 }}>
                    {task.remark ? (
                      <Tooltip
                        label={task.remark}
                        multiline
                        maw={300}
                        styles={{ tooltip: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
                      >
                        <span style={{ display: 'inline-block', cursor: 'pointer' }}>
                          <Text lineClamp={2} style={{ maxWidth: 110 }}>{task.remark}</Text>
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

      {/* 责任人工作量统计 */}
      {assigneeStats.length > 0 && (
        <Paper mt="md" p="sm" withBorder>
          <Text size="sm" fw={500} mb="xs">责任人工作量统计（人天）</Text>
          <Group gap="lg">
            {assigneeStats.map(stat => (
              <Group key={stat.assignee} gap="xs">
                <Text size="sm" fw={500}>{stat.assignee}:</Text>
                <Text size="sm" c="orange">计划 {stat.plannedWeeklyWorkload}</Text>
                <Text size="sm" c="dimmed">/</Text>
                <Text size="sm" c="blue">实际 {stat.weeklyWorkload}</Text>
              </Group>
            ))}
          </Group>
        </Paper>
      )}

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
          defaultYear={year}
          defaultWeekNumber={weekNumber}
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

      <CopyTaskModal
        opened={copyModalOpened}
        onClose={closeCopyModal}
        onSuccess={() => {
          closeCopyModal();
          fetchTasks();
        }}
        users={users}
      />
    </div>
  );
}