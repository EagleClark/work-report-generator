import { useState, useEffect } from 'react';
import { Container, Title, Text, Table, Group, Button, NumberInput, Badge, SimpleGrid, Paper, RingProgress, ScrollArea } from '@mantine/core';
import { taskApi } from '../services/task.api';
import type { WeeklySummary } from '../types/task';

export function WeeklyReportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState(getCurrentWeekNumber());
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Container size="xl" py="xl">
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

          <Text size="lg" fw={500} mb="sm">任务明细</Text>
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>项目</Table.Th>
                  <Table.Th>US/DTS</Table.Th>
                  <Table.Th>任务详情</Table.Th>
                  <Table.Th>进度</Table.Th>
                  <Table.Th>预计(人天)</Table.Th>
                  <Table.Th>本周(人天)</Table.Th>
                  <Table.Th>实际(人天)</Table.Th>
                  <Table.Th>计划时间</Table.Th>
                  <Table.Th>实际时间</Table.Th>
                  <Table.Th>责任人</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {summary.tasks.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={10}>
                      <Text c="dimmed" ta="center">暂无数据</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  summary.tasks.map((task) => (
                    <Table.Tr key={task.id}>
                      <Table.Td>{task.project}</Table.Td>
                      <Table.Td>{task.usDts || '-'}</Table.Td>
                      <Table.Td>
                        <Text lineClamp={2}>{task.taskDetail}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getProgressColor(task.progress)}>
                          {task.progress}%
                        </Badge>
                      </Table.Td>
                      <Table.Td>{task.estimatedWorkload}</Table.Td>
                      <Table.Td>{task.weeklyWorkload}</Table.Td>
                      <Table.Td>{task.actualWorkload}</Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {task.plannedStartDate || '-'} ~ {task.plannedEndDate || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {task.actualStartDate || '-'} ~ {task.actualEndDate || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>{task.assignee || '-'}</Table.Td>
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
