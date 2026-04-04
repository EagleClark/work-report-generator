import { useState, useEffect, useMemo } from 'react';
import {
  Container, Title, Text, Table, Group, Button, NumberInput, Badge,
  SimpleGrid, Paper, RingProgress, ScrollArea, Stack, Box, ThemeIcon, Tooltip
} from '@mantine/core';
import { taskApi } from '../services/task.api';
import type { WeeklySummary, Task } from '../types/task';

// 项目统计项接口
interface ProjectUsDtsStats {
  project: string;
  dts: { planned: number; completed: number; inProgress: number };
  us: { planned: number; completed: number; inProgress: number };
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

export function WeeklyReportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState(getCurrentWeekNumber());
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);

  // 计算项目维度统计
  const projectStats = useMemo(() => {
    if (!summary?.tasks) return [];
    return calculateProjectStats(summary.tasks);
  }, [summary?.tasks]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getWeeklySummary(year, Number(weekNumber));
      setSummary(data);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'green';
    if (progress >= 50) return 'yellow';
    if (progress > 0) return 'blue';
    return 'gray';
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
    <Container size="xl" py="xl" style={{ minWidth: 1600 }}>
      <Title order={1} mb="xs">周报汇总</Title>
      <Text c="dimmed" mb="xl">查看每周任务汇总</Text>

      <Group mb="lg" align="flex-end">
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
          description={getWeekDateRange(year, Number(weekNumber))}
          value={weekNumber}
          onChange={(val) => setWeekNumber(Number(val))}
          min={1}
          max={53}
          style={{ width: 120 }}
        />
        <Button onClick={fetchSummary} loading={loading}>
          查询
        </Button>
      </Group>

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

          <Group mb="sm">
            <Text size="lg" fw={500}>任务明细</Text>
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
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {summary.tasks.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={11}>
                        <Text c="dimmed" ta="center">暂无数据</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    summary.tasks.map((task) => (
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
                            <span style={{ display: 'inline-block', cursor: 'pointer' }}>
                              <Text lineClamp={2} style={{ maxWidth: 350 }}>{task.taskDetail}</Text>
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
                        <Table.Td style={{ width: 90 }}>{task.weeklyWorkload}</Table.Td>
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

function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
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
