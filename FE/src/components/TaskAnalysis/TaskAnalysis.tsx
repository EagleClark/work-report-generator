import { useMemo, useState } from 'react';
import {
  Paper, Text, Stack, Group, Badge, Table, ScrollArea, Box, ActionIcon, Collapse
} from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { Task } from '../../types/task';

// 格式化数字，最多保留三位小数
function formatNumber(num: number): string {
  const rounded = Math.round(num * 1000) / 1000;
  return rounded.toString();
}

interface TaskAnalysisProps {
  tasks: Task[];
}

interface TaskDeviation {
  taskId: number;
  taskDetail: string;
  assignee: string;
  estimatedWorkload: number;
  actualWorkload: number;
  deviation: number;
  deviationRate: number;
}

interface ProjectDeviation {
  project: string;
  estimatedWorkload: number;
  actualWorkload: number;
  deviation: number;
  deviationRate: number;
  taskCount: number;
  tasks: TaskDeviation[];
}

export function TaskAnalysis({ tasks }: TaskAnalysisProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // 分析已完成的项目偏差
  const projectDeviations = useMemo(() => {
    // 过滤已完成的任务
    const completedTasks = tasks.filter(t => t.progress === 100);

    // 按项目分组统计
    const projectMap = new Map<string, TaskDeviation[]>();

    completedTasks.forEach(task => {
      const project = task.project;
      if (!projectMap.has(project)) {
        projectMap.set(project, []);
      }

      // 只统计有预估工作量的任务
      if (task.estimatedWorkload > 0) {
        const deviation = (task.actualWorkload || 0) - task.estimatedWorkload;
        const deviationRate = (deviation / task.estimatedWorkload) * 100;
        projectMap.get(project)!.push({
          taskId: task.id,
          taskDetail: task.taskDetail,
          assignee: task.assignee || '未分配',
          estimatedWorkload: task.estimatedWorkload,
          actualWorkload: task.actualWorkload || 0,
          deviation,
          deviationRate,
        });
      }
    });

    // 转换为数组并计算项目级汇总
    const deviations: ProjectDeviation[] = [];
    projectMap.forEach((taskList, project) => {
      if (taskList.length > 0) {
        const totalEstimated = taskList.reduce((sum, t) => sum + t.estimatedWorkload, 0);
        const totalActual = taskList.reduce((sum, t) => sum + t.actualWorkload, 0);
        const totalDeviation = totalActual - totalEstimated;
        const totalDeviationRate = totalEstimated > 0 ? (totalDeviation / totalEstimated) * 100 : 0;

        deviations.push({
          project,
          estimatedWorkload: totalEstimated,
          actualWorkload: totalActual,
          deviation: totalDeviation,
          deviationRate: totalDeviationRate,
          taskCount: taskList.length,
          tasks: taskList.sort((a, b) => b.deviationRate - a.deviationRate),
        });
      }
    });

    // 按偏差率排序（从大到小）
    return deviations.sort((a, b) => b.deviationRate - a.deviationRate);
  }, [tasks]);

  // 根据偏差获取颜色
  const getDeviationColor = (deviation: number, deviationRate: number): string => {
    if (deviation > 2 || deviationRate > 20) return 'red';
    if (deviation > 1 || deviationRate > 10) return 'orange';
    if (deviation >= -1 && deviationRate >= -10) return 'green';
    return 'blue';
  };

  // 获取偏差标签
  const getDeviationLabel = (deviation: number, deviationRate: number): string => {
    if (deviation > 2 || deviationRate > 20) return '严重超支';
    if (deviation > 1 || deviationRate > 10) return '轻微超支';
    if (deviation >= -1 && deviationRate >= -10) return '基本吻合';
    return '提前完成';
  };

  // 切换项目展开状态
  const toggleProject = (project: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(project)) {
        newSet.delete(project);
      } else {
        newSet.add(project);
      }
      return newSet;
    });
  };

  if (projectDeviations.length === 0) {
    return null;
  }

  return (
    <Paper p="md" withBorder radius="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={500}>任务偏差分析</Text>
          <Text size="sm" c="dimmed">已完成任务的工作量偏差统计（点击项目展开详情）</Text>
        </Group>

        <ScrollArea.Autosize mah={400}>
          <Stack gap="xs">
            {projectDeviations.map((item) => {
              const color = getDeviationColor(item.deviation, item.deviationRate);
              const label = getDeviationLabel(item.deviation, item.deviationRate);
              const isExpanded = expandedProjects.has(item.project);

              return (
                <Box key={item.project}>
                  {/* 项目级汇总行 */}
                  <Group
                    p="sm"
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--mantine-color-gray-3)',
                    }}
                    onClick={() => toggleProject(item.project)}
                  >
                    <Group gap="sm" style={{ flex: 1 }}>
                      <ActionIcon size="sm" variant="subtle">
                        {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                      </ActionIcon>
                      <Text fw={500} lineClamp={1} style={{ maxWidth: 150 }}>{item.project}</Text>
                      <Badge size="xs" variant="light">{item.taskCount} 任务</Badge>
                    </Group>
                    <Group gap="md">
                      <Text size="sm" c="dimmed">计划 {formatNumber(item.estimatedWorkload)}</Text>
                      <Text size="sm" c="dimmed">实际 {formatNumber(item.actualWorkload)}</Text>
                      <Text size="sm" fw={600} c={color}>
                        偏差 {item.deviation > 0 ? '+' : ''}{formatNumber(item.deviation)} ({item.deviationRate > 0 ? '+' : ''}{formatNumber(item.deviationRate)}%)
                      </Text>
                      <Badge size="sm" color={color} variant="light">{label}</Badge>
                    </Group>
                  </Group>

                  {/* 任务级详情 */}
                  <Collapse in={isExpanded}>
                    <Box ml="lg" mt="xs" mb="xs">
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ width: 200 }}>任务详情</Table.Th>
                            <Table.Th style={{ width: 80 }}>责任人</Table.Th>
                            <Table.Th style={{ width: 80 }}>计划</Table.Th>
                            <Table.Th style={{ width: 80 }}>实际</Table.Th>
                            <Table.Th style={{ width: 100 }}>偏差</Table.Th>
                            <Table.Th style={{ width: 80 }}>状态</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {item.tasks.map((task) => {
                            const taskColor = getDeviationColor(task.deviation, task.deviationRate);
                            const taskLabel = getDeviationLabel(task.deviation, task.deviationRate);
                            return (
                              <Table.Tr key={task.taskId}>
                                <Table.Td>
                                  <Text lineClamp={1} size="xs">{task.taskDetail}</Text>
                                </Table.Td>
                                <Table.Td>{task.assignee}</Table.Td>
                                <Table.Td>{formatNumber(task.estimatedWorkload)}</Table.Td>
                                <Table.Td>{formatNumber(task.actualWorkload)}</Table.Td>
                                <Table.Td>
                                  <Text fw={500} c={taskColor}>
                                    {task.deviation > 0 ? '+' : ''}{formatNumber(task.deviation)} ({task.deviationRate > 0 ? '+' : ''}{formatNumber(task.deviationRate)}%)
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Badge size="xs" color={taskColor} variant="light">{taskLabel}</Badge>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>

        {/* 图例说明 */}
        <Group gap="md">
          <Group gap="xs">
            <Badge size="xs" color="red" variant="dot">严重超支</Badge>
            <Text size="xs" c="dimmed">偏差 &gt; 2人天 或 &gt; 20%</Text>
          </Group>
          <Group gap="xs">
            <Badge size="xs" color="orange" variant="dot">轻微超支</Badge>
            <Text size="xs" c="dimmed">偏差 1-2人天 或 10-20%</Text>
          </Group>
          <Group gap="xs">
            <Badge size="xs" color="green" variant="dot">基本吻合</Badge>
            <Text size="xs" c="dimmed">偏差 ±1人天 或 ±10%</Text>
          </Group>
          <Group gap="xs">
            <Badge size="xs" color="blue" variant="dot">提前完成</Badge>
            <Text size="xs" c="dimmed">偏差 &lt; -1人天</Text>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}