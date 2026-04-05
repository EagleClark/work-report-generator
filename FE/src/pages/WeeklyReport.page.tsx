import { useState, useEffect, useMemo } from 'react';
import {
  Container, Title, Text, Table, Group, Badge,
  SimpleGrid, Paper, RingProgress, ScrollArea, Stack, Box, ThemeIcon, Tooltip,
  Progress
} from '@mantine/core';
import { taskApi } from '../services/task.api';
import type { WeeklySummary, Task } from '../types/task';
import { useWeek, getWeekDateRange } from '../context/WeekContext';

// 项目统计项接口
interface ProjectUsDtsStats {
  project: string;
  dts: { planned: number; completed: number; inProgress: number };
  us: { planned: number; completed: number; inProgress: number };
}

// 人员工作量统计接口
interface AssigneeStats {
  assignee: string;
  taskCount: number;
  estimatedWorkload: number;
  actualWorkload: number;
  weeklyWorkload: number;
  plannedWeeklyWorkload: number;
  completionRate: number;
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
function getTaskStatus(progress: number): 'completed' | 'inProgress' | 'planned' {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'inProgress';
  return 'planned';
}

// 按项目分组统计 US/DTS
function calculateProjectStats(tasks: Task[]): ProjectUsDtsStats[] {
  const projectMap = new Map<string, ProjectUsDtsStats>();

  tasks.forEach(task => {
    const project = task.project;
    if (!projectMap.has(project)) {
      projectMap.set(project, {
        project,
        dts: { planned: 0, completed: 0, inProgress: 0 },
        us: { planned: 0, completed: 0, inProgress: 0 },
      });
    }

    const stats = projectMap.get(project)!;
    const status = getTaskStatus(task.progress);

    if (isDts(task.usDts)) {
      stats.dts.planned++;
      if (status === 'completed') stats.dts.completed++;
      else if (status === 'inProgress') stats.dts.inProgress++;
    } else if (isUs(task.usDts)) {
      stats.us.planned++;
      if (status === 'completed') stats.us.completed++;
      else if (status === 'inProgress') stats.us.inProgress++;
    }
  });

  // 过滤掉没有 DTS 或 US 数据的项目，并按项目名排序
  return Array.from(projectMap.values())
    .filter(s => s.dts.planned > 0 || s.us.planned > 0)
    .sort((a, b) => a.project.localeCompare(b.project));
}

// 按负责人分组统计工作量
function calculateAssigneeStats(tasks: Task[]): AssigneeStats[] {
  const assigneeMap = new Map<string, AssigneeStats>();

  tasks.forEach(task => {
    const assignee = task.assignee || '未分配';
    if (!assigneeMap.has(assignee)) {
      assigneeMap.set(assignee, {
        assignee,
        taskCount: 0,
        estimatedWorkload: 0,
        actualWorkload: 0,
        weeklyWorkload: 0,
        plannedWeeklyWorkload: 0,
        completionRate: 0,
      });
    }

    const stats = assigneeMap.get(assignee)!;
    stats.taskCount++;
    stats.estimatedWorkload += task.estimatedWorkload || 0;
    stats.actualWorkload += task.actualWorkload || 0;
    stats.weeklyWorkload += task.weeklyWorkload || 0;
    stats.plannedWeeklyWorkload += task.plannedWeeklyWorkload || 0;
  });

  // 计算完成率
  return Array.from(assigneeMap.values())
    .map(stats => ({
      ...stats,
      completionRate: stats.estimatedWorkload > 0
        ? Math.round((stats.actualWorkload / stats.estimatedWorkload) * 100)
        : 0,
    }))
    .sort((a, b) => b.weeklyWorkload - a.weeklyWorkload);
}

export function WeeklyReportPage() {
  const { year, weekNumber } = useWeek();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);

  // 计算项目维度统计
  const projectStats = useMemo(() => {
    if (!summary?.tasks) return [];
    return calculateProjectStats(summary.tasks);
  }, [summary?.tasks]);

  // 计算人员工作量统计
  const assigneeStats = useMemo(() => {
    if (!summary?.tasks) return [];
    return calculateAssigneeStats(summary.tasks);
  }, [summary?.tasks]);

  // 计算团队总体完成率
  const teamCompletionRate = useMemo(() => {
    if (!summary) return 0;
    return summary.totalEstimatedWorkload > 0
      ? Math.round((summary.totalActualWorkload / summary.totalEstimatedWorkload) * 100)
      : 0;
  }, [summary]);

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
    return 'red';
  };

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
    <Container size="xl" py="xl" style={{ minWidth: 1800 }}>
      <Title order={1} mb="xs">周报汇总</Title>
      <Text c="dimmed" mb="xl">查看每周任务汇总</Text>

      {summary && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 4 }} mb="lg">
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed">任务总数</Text>
              <Text size="xl" fw={700}>{summary.totalTasks}</Text>
            </Paper>
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed">预计工作量</Text>
              <Text size="xl" fw={700}>{summary.totalEstimatedWorkload} 人天</Text>
            </Paper>
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed">实际工作量</Text>
              <Text size="xl" fw={700}>{summary.totalActualWorkload} 人天</Text>
            </Paper>
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed">本周工作量</Text>
              <Text size="xl" fw={700}>{summary.totalWeeklyWorkload} 人天</Text>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
            <Paper p="md" withBorder>
              <Group justify="center">
                <RingProgress
                  sections={[
                    { value: summary.totalTasks > 0 ? (summary.completedTasks / summary.totalTasks) * 100 : 0, color: 'green' },
                    { value: summary.totalTasks > 0 ? (summary.inProgressTasks / summary.totalTasks) * 100 : 0, color: 'yellow' },
                    { value: summary.totalTasks > 0 ? (summary.notStartedTasks / summary.totalTasks) * 100 : 0, color: 'gray' },
                  ]}
                  size={100}
                  thickness={10}
                />
              </Group>
              <Text ta="center" mt="sm" size="sm">
                <Text component="span" c="green" fw={700}>{summary.completedTasks}</Text> 已完成 / 
                <Text component="span" c="yellow" fw={700}> {summary.inProgressTasks}</Text> 进行中 / 
                <Text component="span" c="gray" fw={700}> {summary.notStartedTasks}</Text> 未开始
              </Text>
            </Paper>
          </SimpleGrid>

          {/* 项目维度 DTS/US 统计 */}
          {projectStats.length > 0 && (
            <Box mb="lg">
              <Text size="lg" fw={500} mb="md">项目 DTS/US 统计</Text>
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
                    <Group justify="space-between" mb="sm">
                      <Text fw={600} size="md">{stat.project}</Text>
                    </Group>
                    <Stack gap="xs">
                      {/* DTS 统计 */}
                      {stat.dts.planned > 0 && (
                        <Group gap="xs" align="center">
                          <ThemeIcon size="sm" variant="light" color="orange">
                            D
                          </ThemeIcon>
                          <Text size="sm" c="dimmed">DTS:</Text>
                          <Group gap={4}>
                            <Badge size="sm" variant="filled" color="gray">
                              计划 {stat.dts.planned}
                            </Badge>
                            <Badge size="sm" variant="filled" color="green">
                              完成 {stat.dts.completed}
                            </Badge>
                            <Badge size="sm" variant="filled" color="blue">
                              进行中 {stat.dts.inProgress}
                            </Badge>
                          </Group>
                        </Group>
                      )}
                      {/* US 统计 */}
                      {stat.us.planned > 0 && (
                        <Group gap="xs" align="center">
                          <ThemeIcon size="sm" variant="light" color="cyan">
                            U
                          </ThemeIcon>
                          <Text size="sm" c="dimmed">US:</Text>
                          <Group gap={4}>
                            <Badge size="sm" variant="filled" color="gray">
                              计划 {stat.us.planned}
                            </Badge>
                            <Badge size="sm" variant="filled" color="green">
                              完成 {stat.us.completed}
                            </Badge>
                            <Badge size="sm" variant="filled" color="blue">
                              进行中 {stat.us.inProgress}
                            </Badge>
                          </Group>
                        </Group>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* 人员工作量统计 */}
          {assigneeStats.length > 0 && (
            <Box mb="lg">
              <Text size="lg" fw={500} mb="md">人员工作量统计</Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
                {assigneeStats.map((stat) => {
                  const rateColor = stat.completionRate >= 100 ? 'green' : stat.completionRate >= 80 ? 'yellow' : 'red';
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
                          <Text size="sm" c="dimmed">预计</Text>
                          <Text size="sm" fw={500}>{stat.estimatedWorkload} 人天</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">实际</Text>
                          <Text size="sm" fw={500}>{stat.actualWorkload} 人天</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">本周计划</Text>
                          <Text size="sm" fw={500} c="orange">{stat.plannedWeeklyWorkload} 人天</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">本周实际</Text>
                          <Text size="sm" fw={500} c="blue">{stat.weeklyWorkload} 人天</Text>
                        </Group>
                        <Box mt="xs">
                          <Group justify="space-between" mb={4}>
                            <Text size="xs" c="dimmed">完成率</Text>
                            <Text size="xs" fw={500} c={rateColor}>{stat.completionRate}%</Text>
                          </Group>
                          <Progress
                            value={Math.min(stat.completionRate, 100)}
                            color={rateColor}
                            size="sm"
                            radius="xl"
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            </Box>
          )}

          {/* 工作量对比 */}
          {assigneeStats.length > 0 && (
            <Box mb="lg">
              <Text size="lg" fw={500} mb="md">工作量对比</Text>
              <Paper p="md" withBorder radius="md">
                <Stack gap="md">
                  {assigneeStats.map((stat) => {
                    const maxWorkload = Math.max(stat.estimatedWorkload, stat.actualWorkload, 1);
                    const rateColor = stat.completionRate >= 100 ? 'green' : stat.completionRate >= 80 ? 'yellow' : 'red';
                    return (
                      <Box key={stat.assignee}>
                        <Group justify="space-between" mb={4}>
                          <Text size="sm" fw={500} style={{ width: 80 }}>{stat.assignee}</Text>
                          <Group gap="lg">
                            <Text size="xs" c="dimmed">
                              预计 <Text component="span" fw={500}>{stat.estimatedWorkload}</Text> 天
                            </Text>
                            <Text size="xs" c="dimmed">
                              实际 <Text component="span" fw={500}>{stat.actualWorkload}</Text> 天
                            </Text>
                            <Text size="xs" fw={500} c={rateColor}>
                              {stat.completionRate}%
                              {stat.completionRate > 100 && ' ⚠️'}
                            </Text>
                          </Group>
                        </Group>
                        <Group align="center" gap="xs">
                          <Progress
                            value={(stat.estimatedWorkload / maxWorkload) * 100}
                            color="gray"
                            size="sm"
                            style={{ flex: 1 }}
                          />
                          <Progress
                            value={(stat.actualWorkload / maxWorkload) * 100}
                            color={rateColor}
                            size="sm"
                            style={{ flex: 1 }}
                          />
                        </Group>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Box>
          )}

          {/* 团队整体统计 */}
          {summary.totalTasks > 0 && (
            <Box mb="lg">
              <Text size="lg" fw={500} mb="md">团队工作量总览</Text>
              <Paper p="md" withBorder radius="md">
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                  <Box>
                    <Text size="sm" c="dimmed">总预计工作量</Text>
                    <Text size="lg" fw={700}>{summary.totalEstimatedWorkload} 人天</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">总实际工作量</Text>
                    <Text size="lg" fw={700}>{summary.totalActualWorkload} 人天</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">本周投入</Text>
                    <Text size="lg" fw={700} c="blue">{summary.totalWeeklyWorkload} 人天</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">团队完成率</Text>
                    <Group gap="xs">
                      <Text size="lg" fw={700} c={teamCompletionRate >= 100 ? 'green' : teamCompletionRate >= 80 ? 'yellow' : 'red'}>
                        {teamCompletionRate}%
                      </Text>
                    </Group>
                  </Box>
                </SimpleGrid>
                <Box mt="md">
                  <Progress
                    value={Math.min(teamCompletionRate, 100)}
                    color={teamCompletionRate >= 100 ? 'green' : teamCompletionRate >= 80 ? 'yellow' : 'red'}
                    size="lg"
                    radius="xl"
                  />
                </Box>
                {assigneeStats.length > 0 && (
                  <Text size="sm" c="dimmed" mt="sm">
                    人均本周投入：{(summary.totalWeeklyWorkload / assigneeStats.length).toFixed(1)} 人天
                  </Text>
                )}
              </Paper>
            </Box>
          )}

          <Group mb="sm">
            <Text size="lg" fw={500}>任务明细</Text>
            <Text size="sm" c="dimmed">工作量单位：人天</Text>
          </Group>
          <ScrollArea>
            <Table striped highlightOnHover style={{ minWidth: 1680 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 100 }}>项目</Table.Th>
                    <Table.Th style={{ width: 190 }}>US/DTS</Table.Th>
                    <Table.Th style={{ width: 300 }}>任务详情</Table.Th>
                    <Table.Th style={{ width: 90 }}>进度</Table.Th>
                    <Table.Th style={{ width: 90 }}>预计</Table.Th>
                    <Table.Th style={{ width: 90 }}>实际</Table.Th>
                    <Table.Th style={{ width: 90 }}>本周计划</Table.Th>
                    <Table.Th style={{ width: 90 }}>本周实际</Table.Th>
                    <Table.Th style={{ width: 170 }}>计划时间</Table.Th>
                    <Table.Th style={{ width: 170 }}>实际时间</Table.Th>
                    <Table.Th style={{ width: 90 }}>责任人</Table.Th>
                    <Table.Th style={{ width: 110 }}>备注</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {summary.tasks.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={12}>
                        <Text c="dimmed" ta="center">暂无数据</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    summary.tasks.map((task) => (
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
