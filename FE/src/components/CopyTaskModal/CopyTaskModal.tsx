import { useState } from 'react';
import {
  Modal, Text, Group, Button, Select, Stack, NumberInput,
  Alert, Divider, Box, SimpleGrid
} from '@mantine/core';
import { taskApi } from '../../services/task.api';
import type { User } from '../../types/user';
import { CopyMode } from '../../types/task';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

interface CopyTaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  users: User[];
}

// 获取当前周数
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// 获取周日期范围
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

export function CopyTaskModal({
  opened,
  onClose,
  onSuccess,
  users,
}: CopyTaskModalProps) {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copyMode, setCopyMode] = useState<CopyMode>(CopyMode.SELF);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // 目标周次（用户选择）
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetWeek, setTargetWeek] = useState(getCurrentWeekNumber());

  const isAdmin = hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  // 计算上周（源周次）
  const getPreviousWeek = (year: number, week: number) => {
    if (week === 1) {
      return { year: year - 1, weekNumber: 52 };
    }
    return { year, weekNumber: week - 1 };
  };

  const sourceWeek = getPreviousWeek(targetYear, targetWeek);

  const handleCopy = async () => {
    setLoading(true);
    try {
      const copyDto = {
        year: targetYear,
        weekNumber: targetWeek,
        copyMode,
        userId: selectedUserId || undefined,
      };

      const copyResult = await taskApi.copyIncompleteTasks(copyDto);

      if (copyResult.copiedCount > 0) {
        notifications.show({
          title: '复制成功',
          message: `成功复制 ${copyResult.copiedCount} 个任务${copyResult.skippedCount > 0 ? `，跳过 ${copyResult.skippedCount} 个重复任务` : ''}`,
          color: 'green',
        });
        onSuccess();
        handleClose();
      } else if (copyResult.skippedCount > 0) {
        notifications.show({
          title: '没有新任务',
          message: '所有任务都已存在于本周',
          color: 'yellow',
        });
      } else {
        notifications.show({
          title: '没有可复制的任务',
          message: `${sourceWeek.year}年第${sourceWeek.weekNumber}周没有未完成的任务`,
          color: 'yellow',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: '复制失败',
        message: error.response?.data?.message || '未知错误',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCopyMode(CopyMode.SELF);
    setSelectedUserId(null);
    setTargetYear(new Date().getFullYear());
    setTargetWeek(getCurrentWeekNumber());
    onClose();
  };

  // 过滤用户（排除超管）
  const availableUsers = users.filter(u => u.role !== UserRole.SUPER_ADMIN);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="复制上周未完成任务"
      size="md"
      centered
    >
      <Stack gap="md">
        <Alert variant="light" color="blue" icon="ℹ️">
          <Text size="sm">
            此功能将复制源周次中未完成的任务（进度小于100%）到目标周次。请确保源周次的任务状态已更新后再操作。
          </Text>
        </Alert>

        <Alert variant="light" color="yellow" icon="⚠️">
          <Text size="sm">
            请谨慎操作：复制前请确认源周次工作状态已全部更新。重复的任务将自动跳过。
          </Text>
        </Alert>

        <Divider label="周次选择" labelPosition="center" />

        <SimpleGrid cols={2}>
          <Box>
            <Text size="sm" fw={500} mb="xs">目标周次</Text>
            <Group gap="xs">
              <NumberInput
                value={targetYear}
                onChange={(val) => setTargetYear(Number(val) || new Date().getFullYear())}
                min={2000}
                max={2100}
                style={{ width: 80 }}
              />
              <NumberInput
                value={targetWeek}
                onChange={(val) => setTargetWeek(Number(val) || 1)}
                min={1}
                max={53}
                style={{ width: 60 }}
              />
            </Group>
            <Text size="xs" c="dimmed" mt="xs">{getWeekDateRange(targetYear, targetWeek)}</Text>
          </Box>
          <Box>
            <Text size="sm" fw={500} mb="xs">源周次（自动计算）</Text>
            <Text size="sm">
              {sourceWeek.year}年 第{sourceWeek.weekNumber}周
            </Text>
            <Text size="xs" c="dimmed" mt="xs">{getWeekDateRange(sourceWeek.year, sourceWeek.weekNumber)}</Text>
          </Box>
        </SimpleGrid>

        {isAdmin && (
          <>
            <Divider label="管理员选项" labelPosition="center" />
            <Select
              label="复制范围"
              data={[
                { value: CopyMode.SELF, label: '仅复制自己的任务' },
                { value: CopyMode.ALL, label: '复制所有用户的任务' },
                { value: CopyMode.SPECIFIC_USER, label: '复制指定用户的任务' },
              ]}
              value={copyMode}
              onChange={(value) => setCopyMode(value as CopyMode)}
            />

            {copyMode === CopyMode.SPECIFIC_USER && (
              <Select
                label="选择用户"
                placeholder="请选择用户"
                data={availableUsers.map(u => ({
                  value: u.id.toString(),
                  label: u.username,
                }))}
                value={selectedUserId?.toString() || ''}
                onChange={(value) => setSelectedUserId(value ? Number(value) : null)}
                required
                searchable
              />
            )}
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleCopy} loading={loading} disabled={copyMode === CopyMode.SPECIFIC_USER && !selectedUserId}>
            开始复制
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}