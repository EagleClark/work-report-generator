import { useState, useEffect, useMemo } from 'react';
import {
  Container, Title, Text, Table, Group, Badge,
  SimpleGrid, Paper, ScrollArea, Stack, Box, ThemeIcon, Tooltip,
  Divider, ActionIcon
} from '@mantine/core';
import { taskApi } from '../services/task.api';
import type { WeeklySummary, Task } from '../types/task';
import { useWeek } from '../context/WeekContext';
import { AIAnalysisDisplay } from '../components/AIAnalysisDisplay/AIAnalysisDisplay';

// 任务分类统计接口
interface CategoryStats {
  planned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

// 项目统计接口
interface ProjectStats {
  project: string;
  us: CategoryStats;
  dts: CategoryStats;
  other: CategoryStats;
}

// 人员-项目统计接口
interface AssigneeProjectStats {
  assignee: string;
  taskCount: number;
  weeklyWorkload: number;
  plannedWeeklyWorkload: number;
  projects: {
    project: string;
    us: CategoryStats;
    dts: CategoryStats;
    other: CategoryStats;
  }[];
}

// 判断是否为 DTS (以 DTS- 或 DTS 开头)
function isDts(usDts: string | undefined): boolean {
  if (!usDts) return false;
  return usDts.toUpperCase().startsWith('DTS');
}

// 判断是否为 US (以 US- 或 US 开头)
function isUs(usDts: string | undefined): boolean {
  if (!usDts) return false;
  return usDts.toUpperCase().startsWith('US');
}

// 获取任务状态
function getTaskStatus(progress: number): 'completed' | 'inProgress' | 'notStarted' {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'inProgress';
  return 'notStarted';
}

// 创建空的分类统计
function createEmptyCategoryStats(): CategoryStats {
  return { planned: 0, completed: 0, inProgress: 0, notStarted: 0 };
}

// 按项目分组统计
function calculateProjectStats(tasks: Task[]): ProjectStats[] {
  const projectMap = new Map<string, ProjectStats>();

  tasks.forEach(task => {
    const project = task.project;
    const status = getTaskStatus(task.progress);
    const category = isDts(task.usDts) ? 'dts' : isUs(task.usDts) ? 'us' : 'other';

    if (!projectMap.has(project)) {
      projectMap.set(project, {
        project,
        us: createEmptyCategoryStats(),
        dts: createEmptyCategoryStats(),
        other: createEmptyCategoryStats(),
      });
    }

    const stats = projectMap.get(project)!;
    stats[category].planned++;
    if (status === 'completed') stats[category].completed++;
    else if (status === 'inProgress') stats[category].inProgress++;
    else stats[category].notStarted++;
  });

  return Array.from(projectMap.values())
    .filter(s => s.us.planned > 0 || s.dts.planned > 0 || s.other.planned > 0)
    .sort((a, b) => a.project.localeCompare(b.project));
}

// 按人员-项目分组统计
function calculateAssigneeProjectStats(tasks: Task[]): AssigneeProjectStats[] {
  const assigneeMap = new Map<string, AssigneeProjectStats>();

  tasks.forEach(task => {
    const assignee = task.assignee || '未分配';
    const project = task.project;
    const status = getTaskStatus(task.progress);
    const category = isDts(task.usDts) ? 'dts' : isUs(task.usDts) ? 'us' : 'other';

    if (!assigneeMap.has(assignee)) {
      assigneeMap.set(assignee, {
        assignee,
        taskCount: 0,
        weeklyWorkload: 0,
        plannedWeeklyWorkload: 0,
        projects: [],
      });
    }

    const assigneeStats = assigneeMap.get(assignee)!;
    assigneeStats.taskCount++;
    assigneeStats.weeklyWorkload += task.weeklyWorkload || 0;
    assigneeStats.plannedWeeklyWorkload += task.plannedWeeklyWorkload || 0;

    // 查找或创建项目统计
    let projectStats = assigneeStats.projects.find(p => p.project === project);
    if (!projectStats) {
      projectStats = {
        project,
        us: createEmptyCategoryStats(),
        dts: createEmptyCategoryStats(),
        other: createEmptyCategoryStats(),
      };
      assigneeStats.projects.push(projectStats);
    }

    // 更新分类统计
    projectStats[category].planned++;
    if (status === 'completed') projectStats[category].completed++;
    else if (status === 'inProgress') projectStats[category].inProgress++;
    else projectStats[category].notStarted++;
  });

  // 按项目名排序每个人员的项目列表
  return Array.from(assigneeMap.values())
    .map(stats => ({
      ...stats,
      projects: stats.projects.sort((a, b) => a.project.localeCompare(b.project)),
    }))
    .sort((a, b) => b.weeklyWorkload - a.weeklyWorkload);
}

// 状态颜色配置
const STATUS_COLORS = {
  planned: 'gray',
  completed: 'green',
  inProgress: 'blue',
  notStarted: 'cyan',
} as const;

// 分类颜色配置
const CATEGORY_COLORS = {
  us: 'violet',
  dts: 'orange',
  other: 'teal',
} as const;

export function WeeklyReportPage() {
  const { year, weekNumber } = useWeek();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!summary?.tasks) return [];
    if (!sortField) return summary.tasks;

    return [...summary.tasks].sort((a, b) => {
      const aValue = sortField === 'project' ? a.project : (a.assignee || '未分配');
      const bValue = sortField === 'project' ? b.project : (b.assignee || '未分配');
      const cmp = aValue.localeCompare(bValue, 'zh-CN');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [summary?.tasks, sortField, sortDirection]);

  // 计算项目维度统计
  const projectStats = useMemo(() => {
    if (!summary?.tasks) return [];
    return calculateProjectStats(summary.tasks);
  }, [summary?.tasks]);

  // 计算人员-项目统计
  const assigneeProjectStats = useMemo(() => {
    if (!summary?.tasks) return [];
    return calculateAssigneeProjectStats(summary.tasks);
  }, [summary?.tasks]);

  // 计算人员数量
  const assigneeCount = useMemo(() => {
    if (!assigneeProjectStats.length) return 0;
    return assigneeProjectStats.length;
  }, [assigneeProjectStats]);

  // 计算需求概览：已完成和进行中的US需求（仅统计US/DTS列以US开头的任务）
  const requirementOverview = useMemo(() => {
    if (!summary?.tasks) return { completed: [], inProgress: [] };

    // 只统计US开头的需求
    const usTasks = summary.tasks.filter(task => isUs(task.usDts));

    const completed = usTasks
      .filter(task => task.progress === 100)
      .map(task => ({
        project: task.project,
        taskDetail: task.taskDetail,
        status: 'completed' as const,
      }))
      .sort((a, b) => a.project.localeCompare(b.project, 'zh-CN')); // 按项目排序

    const inProgress = usTasks
      .filter(task => task.progress > 0 && task.progress < 100)
      .map(task => ({
        project: task.project,
        taskDetail: task.taskDetail,
        status: 'inProgress' as const,
      }))
      .sort((a, b) => a.project.localeCompare(b.project, 'zh-CN')); // 按项目排序

    return { completed, inProgress };
  }, [summary?.tasks]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getWeeklySummary(year, weekNumber);
      setSummary(data);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  // 年份或周数变化时自动查询
  useEffect(() => {
    fetchSummary();
  }, [year, weekNumber]);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'green';
    if (progress >= 75) return 'blue';
    if (progress >= 50) return 'yellow';
    if (progress >= 25) return 'orange';
    if (progress > 0) return 'red';
    return 'gray';
  };

  // 渲染US/DTS，支持链接
  const renderUsDts = (task: Task) => {
    if (!task.usDts) {
      return <Text c="dimmed">-</Text>;
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

  // 渲染分类统计徽章（项目统计用）
  const renderCategoryBadges = (
    label: string,
    stats: CategoryStats,
    color: string
  ) => {
    if (stats.planned === 0) return null;

    return (
      <Group gap="xs" align="center" wrap="nowrap">
        <Badge size="lg" variant="filled" color={color} radius="sm" style={{ minWidth: 50 }}>
          {label}
        </Badge>
        <Group gap={4} wrap="nowrap">
          <Badge size="sm" variant="filled" color={STATUS_COLORS.planned}>
            计划 {stats.planned}
          </Badge>
          <Badge size="sm" variant="filled" color={STATUS_COLORS.completed}>
            完成 {stats.completed}
          </Badge>
          <Badge size="sm" variant="filled" color={STATUS_COLORS.inProgress}>
            进行中 {stats.inProgress}
          </Badge>
          <Badge size="sm" variant="filled" color={STATUS_COLORS.notStarted}>
            未开始 {stats.notStarted}
          </Badge>
        </Group>
      </Group>
    );
  };

  // 渲染单个项目的所有分类统计（一行显示）
  const renderProjectInlineStats = (projectStats: { project: string; us: CategoryStats; dts: CategoryStats; other: CategoryStats }) => {
    const hasUs = projectStats.us.planned > 0;
    const hasDts = projectStats.dts.planned > 0;
    const hasOther = projectStats.other.planned > 0;

    if (!hasUs && !hasDts && !hasOther) return null;

    return (
      <Group gap="md" align="flex-start" wrap="wrap">
        <Text size="xs" fw={600} style={{ width: 120, flexShrink: 0, wordBreak: 'break-word' }}>{projectStats.project}</Text>
        <Group gap="md" align="center" wrap="wrap">
          {hasUs && (
            <Group gap={3} align="center">
              <Badge size="xs" variant="filled" color={CATEGORY_COLORS.us} radius="sm">US</Badge>
              <Group gap={2}>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.planned}>{projectStats.us.planned}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.completed}>{projectStats.us.completed}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.inProgress}>{projectStats.us.inProgress}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.notStarted}>{projectStats.us.notStarted}</Badge>
              </Group>
            </Group>
          )}
          {hasDts && (
            <Group gap={3} align="center">
              <Badge size="xs" variant="filled" color={CATEGORY_COLORS.dts} radius="sm">DTS</Badge>
              <Group gap={2}>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.planned}>{projectStats.dts.planned}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.completed}>{projectStats.dts.completed}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.inProgress}>{projectStats.dts.inProgress}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.notStarted}>{projectStats.dts.notStarted}</Badge>
              </Group>
            </Group>
          )}
          {hasOther && (
            <Group gap={3} align="center">
              <Badge size="xs" variant="filled" color={CATEGORY_COLORS.other} radius="sm">其它</Badge>
              <Group gap={2}>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.planned}>{projectStats.other.planned}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.completed}>{projectStats.other.completed}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.inProgress}>{projectStats.other.inProgress}</Badge>
                <Badge size="xs" variant="outline" color={STATUS_COLORS.notStarted}>{projectStats.other.notStarted}</Badge>
              </Group>
            </Group>
          )}
        </Group>
      </Group>
    );
  };

  // 格式化数字，最多保留三位小数
  const formatNumber = (num: number): string => {
    const rounded = Math.round(num * 1000) / 1000;
    return rounded.toString();
  };

  // 计算本周工作量偏差
  const workloadDeviation = summary ? summary.totalWeeklyWorkload - (summary.totalPlannedWeeklyWorkload || 0) : 0;
  const getDeviationColor = (deviation: number) => {
    if (deviation > 0) return 'red';
    if (deviation < 0) return 'gray';
    return 'green';
  };

  return (
    <Container size="xl" py="xl" style={{ minWidth: 1800 }}>
      <Title order={1} mb="xs">周报汇总</Title>
      <Text c="dimmed" mb="xl">查看每周任务汇总</Text>

      {summary && (
        <>
          {/* 顶部统计卡片 */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
            <Paper p="md" withBorder radius="md">
              <Text size="sm" c="dimmed">任务总数</Text>
              <Text fw={700} style={{ fontSize: 24 }}>{summary.totalTasks}</Text>
            </Paper>
            <Paper p="md" withBorder radius="md">
              <Text size="sm" c="dimmed">人员投入</Text>
              <Text fw={700} style={{ fontSize: 24 }}>{assigneeCount} 人</Text>
            </Paper>
            <Paper p="md" withBorder radius="md">
              <Text size="sm" c="dimmed">本周工作量偏差</Text>
              <Group align="baseline" gap={8}>
                <Text
                  fw={700}
                  c={getDeviationColor(workloadDeviation)}
                  style={{ fontSize: 24 }}
                >
                  {workloadDeviation > 0 ? '+' : ''}{formatNumber(workloadDeviation)} 人天
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                实际 {formatNumber(summary.totalWeeklyWorkload)} - 计划 {formatNumber(summary.totalPlannedWeeklyWorkload || 0)}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* AI 智能分析 */}
          <Box mb="lg">
            <AIAnalysisDisplay year={year} weekNumber={weekNumber} />
          </Box>

          {/* 项目维度统计 */}
          {projectStats.length > 0 && (
            <Box mb="lg">
              <Text size="lg" fw={500} mb="md">项目任务统计</Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                {projectStats.map((stat) => (
                  <Paper
                    key={stat.project}
                    p="md"
                    withBorder
                    radius="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
                    }}
                  >
                    <Text fw={600} size="md" mb="sm">{stat.project}</Text>
                    <Stack gap="xs">
                      {renderCategoryBadges('US', stat.us, CATEGORY_COLORS.us)}
                      {renderCategoryBadges('DTS', stat.dts, CATEGORY_COLORS.dts)}
                      {renderCategoryBadges('其它', stat.other, CATEGORY_COLORS.other)}
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* 需求概览 - 放在人员工作量统计上面 */}
          {(requirementOverview.completed.length > 0 || requirementOverview.inProgress.length > 0) && (
            <Box mb="lg">
              <Group justify="space-between" align="center" mb="md">
                <Text size="lg" fw={500}>需求概览</Text>
                <Group gap="md">
                  <Badge size="lg" color="green" variant="light" leftSection="✓">
                    已完成 {requirementOverview.completed.length}
                  </Badge>
                  <Badge size="lg" color="blue" variant="light" leftSection="◐">
                    进行中 {requirementOverview.inProgress.length}
                  </Badge>
                </Group>
              </Group>

              <SimpleGrid cols={2} spacing="md">
                {/* 已完成表格 */}
                <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                  <Box
                    px="md"
                    py="xs"
                    style={{
                      borderBottom: '1px solid var(--mantine-color-gray-3)',
                      borderLeft: '3px solid var(--mantine-color-teal-6)',
                    }}
                  >
                    <Group gap="xs">
                      <Text size="sm" fw={500} c="teal.7">已完成</Text>
                      <Badge size="xs" color="teal" variant="light">{requirementOverview.completed.length}</Badge>
                    </Group>
                  </Box>
                  <ScrollArea.Autosize mah={280}>
                    {requirementOverview.completed.length === 0 ? (
                      <Text c="dimmed" ta="center" py="xl" size="sm">暂无已完成需求</Text>
                    ) : (
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ width: 150 }}>项目</Table.Th>
                            <Table.Th>任务详情</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {requirementOverview.completed.map((item, index) => (
                            <Table.Tr key={index}>
                              <Table.Td>
                                <Badge size="sm" variant="dot" color="gray" radius="sm" tt="none">
                                  {item.project}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" lineClamp={2}>{item.taskDetail}</Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </ScrollArea.Autosize>
                </Paper>

                {/* 进行中表格 */}
                <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                  <Box
                    px="md"
                    py="xs"
                    style={{
                      borderBottom: '1px solid var(--mantine-color-gray-3)',
                      borderLeft: '3px solid var(--mantine-color-cyan-6)',
                    }}
                  >
                    <Group gap="xs">
                      <Text size="sm" fw={500} c="cyan.7">进行中</Text>
                      <Badge size="xs" color="cyan" variant="light">{requirementOverview.inProgress.length}</Badge>
                    </Group>
                  </Box>
                  <ScrollArea.Autosize mah={280}>
                    {requirementOverview.inProgress.length === 0 ? (
                      <Text c="dimmed" ta="center" py="xl" size="sm">暂无进行中需求</Text>
                    ) : (
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ width: 150 }}>项目</Table.Th>
                            <Table.Th>任务详情</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {requirementOverview.inProgress.map((item, index) => (
                            <Table.Tr key={index}>
                              <Table.Td>
                                <Badge size="sm" variant="dot" color="gray" radius="sm" tt="none">
                                  {item.project}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" lineClamp={2}>{item.taskDetail}</Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </ScrollArea.Autosize>
                </Paper>
              </SimpleGrid>
            </Box>
          )}

          {/* 人员工作量统计 - 卡片形式，一行最多3个 */}
          {assigneeProjectStats.length > 0 && (
            <Box mb="lg">
              <Text size="lg" fw={500} mb="md">人员工作量统计</Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {assigneeProjectStats.map((stat) => {
                  const deviation = stat.weeklyWorkload - stat.plannedWeeklyWorkload;
                  const deviationColor = deviation > 0 ? 'red' : deviation < 0 ? 'gray' : 'green';
                  return (
                    <Paper
                      key={stat.assignee}
                      p="md"
                      withBorder
                      radius="md"
                    >
                      <Group justify="space-between" mb="xs">
                        <Text fw={600} size="md">{stat.assignee}</Text>
                        <Badge size="sm" variant="light">{stat.taskCount} 个任务</Badge>
                      </Group>

                      <Stack gap={4}>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">本周计划</Text>
                          <Text size="sm" fw={500} c="orange">{formatNumber(stat.plannedWeeklyWorkload)} 人天</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">本周实际</Text>
                          <Text size="sm" fw={500} c="blue">{formatNumber(stat.weeklyWorkload)} 人天</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">偏差</Text>
                          <Text size="sm" fw={700} c={deviationColor}>
                            {deviation > 0 ? '+' : ''}{formatNumber(deviation)} 人天
                          </Text>
                        </Group>

                        <Divider my="xs" />

                        {/* 按项目展示任务统计 - 一行显示 */}
                        {stat.projects.map((projectStats) => (
                          <Box key={projectStats.project}>
                            {renderProjectInlineStats(projectStats)}
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            </Box>
          )}

          <Group mb="sm">
            <Text size="lg" fw={500}>任务明细</Text>
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
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedTasks.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={12}>
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
                            <span style={{ display: 'inline-block', cursor: 'pointer' }}>
                              <Text lineClamp={2} style={{ maxWidth: 300 }}>{task.taskDetail}</Text>
                            </span>
                          </Tooltip>
                        </Table.Td>
                        <Table.Td style={{ width: 90 }}>
                          <Badge color={getProgressColor(task.progress)}>
                            {task.progress}%
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ width: 90 }}>{task.estimatedWorkload}</Table.Td>
                        <Table.Td style={{ width: 90 }}>{task.actualWorkload}</Table.Td>
                        <Table.Td style={{ width: 90 }}>{task.plannedWeeklyWorkload || '-'}</Table.Td>
                        <Table.Td style={{ width: 90 }}>{task.weeklyWorkload}</Table.Td>
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
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
          </ScrollArea>
        </>
      )}
    </Container>
  );
}