import { useState } from 'react';
import { TextInput, Textarea, NumberInput, Button, Group, Stack, SimpleGrid, Text } from '@mantine/core';
import type { CreateTaskDto, Task } from '../../types/task';

interface TaskFormProps {
  onSubmit: (dto: CreateTaskDto) => Promise<void>;
  onCancel?: () => void;
  initialData?: Task;
  isEdit?: boolean;
}

export function TaskForm({ onSubmit, onCancel, initialData, isEdit }: TaskFormProps) {
  const [project, setProject] = useState(initialData?.project || '');
  const [assignee, setAssignee] = useState(initialData?.assignee || '');
  const [usDts, setUsDts] = useState(initialData?.usDts || '');
  const [link, setLink] = useState(initialData?.remark || ''); // 用 remark 字段存链接
  const [taskDetail, setTaskDetail] = useState(initialData?.taskDetail || '');
  const [progress, setProgress] = useState(initialData?.progress || 0);
  const [estimatedWorkload, setEstimatedWorkload] = useState(initialData?.estimatedWorkload || 0);
  const [plannedStartDate, setPlannedStartDate] = useState(initialData?.plannedStartDate || '');
  const [plannedEndDate, setPlannedEndDate] = useState(initialData?.plannedEndDate || '');
  const [actualWorkload, setActualWorkload] = useState(initialData?.actualWorkload || 0);
  const [weeklyWorkload, setWeeklyWorkload] = useState(initialData?.weeklyWorkload || 0);
  const [actualStartDate, setActualStartDate] = useState(initialData?.actualStartDate || '');
  const [actualEndDate, setActualEndDate] = useState(initialData?.actualEndDate || '');
  const [year, setYear] = useState(initialData?.year || new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState(initialData?.weekNumber || getCurrentWeekNumber());
  const [remark, setRemark] = useState(initialData?.remark || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        project,
        assignee,
        usDts,
        taskDetail,
        progress,
        estimatedWorkload,
        plannedStartDate,
        plannedEndDate,
        actualWorkload: isEdit ? actualWorkload : undefined,
        weeklyWorkload: isEdit ? weeklyWorkload : undefined,
        actualStartDate: isEdit ? actualStartDate : undefined,
        actualEndDate: isEdit ? actualEndDate : undefined,
        year,
        weekNumber,
        remark: link || remark,
      });
      if (!isEdit) {
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProject('');
    setAssignee('');
    setUsDts('');
    setLink('');
    setTaskDetail('');
    setProgress(0);
    setEstimatedWorkload(0);
    setPlannedStartDate('');
    setPlannedEndDate('');
    setActualWorkload(0);
    setWeeklyWorkload(0);
    setActualStartDate('');
    setActualEndDate('');
    setRemark('');
    setYear(new Date().getFullYear());
    setWeekNumber(getCurrentWeekNumber());
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* 第一行：项目 + 责任人（必填） */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="项目"
            placeholder="请输入项目名称"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            required
          />
          <TextInput
            label="责任人"
            placeholder="请输入责任人"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            required
          />
        </SimpleGrid>

        {/* 第二行：US/DTS + 链接（非必填） */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="US/DTS"
            placeholder="US/DTS编号"
            value={usDts}
            onChange={(e) => setUsDts(e.target.value)}
          />
          <TextInput
            label="US/DTS链接"
            placeholder="请输入US/DTS链接"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </SimpleGrid>

        {/* 第三行：任务详情（必填，富文本框，最多200字符） */}
        <Textarea
          label="任务详情"
          placeholder="请输入任务详情"
          value={taskDetail}
          onChange={(e) => setTaskDetail(e.target.value.slice(0, 200))}
          minRows={3}
          maxLength={200}
          required
          description={`${taskDetail.length}/200`}
        />

        {/* 第四行：当前进度 + 预计工作量（必填） */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <NumberInput
            label="当前进度"
            suffix=" %"
            value={progress}
            onChange={(val) => setProgress(Number(val) || 0)}
            min={0}
            max={100}
            required
          />
          <NumberInput
            label="预计工作量"
            suffix=" 人天"
            value={estimatedWorkload}
            onChange={(val) => setEstimatedWorkload(Number(val) || 0)}
            min={0}
            required
          />
        </SimpleGrid>

        {/* 第五行：计划开始时间 + 计划结束时间（必填） */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="计划开始时间"
            type="date"
            value={plannedStartDate}
            onChange={(e) => setPlannedStartDate(e.target.value)}
            required
          />
          <TextInput
            label="计划结束时间"
            type="date"
            value={plannedEndDate}
            onChange={(e) => setPlannedEndDate(e.target.value)}
            required
          />
        </SimpleGrid>

        {/* 第六行：实际工作量 + 本周工作量（编辑时显示） */}
        {isEdit && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="实际工作量"
              suffix=" 人天"
              value={actualWorkload}
              onChange={(val) => setActualWorkload(Number(val) || 0)}
              min={0}
            />
            <NumberInput
              label="本周工作量"
              suffix=" 人天"
              value={weeklyWorkload}
              onChange={(val) => setWeeklyWorkload(Number(val) || 0)}
              min={0}
            />
          </SimpleGrid>
        )}

        {/* 第七行：实际开始时间 + 实际结束时间（编辑时显示） */}
        {isEdit && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="实际开始时间"
              type="date"
              value={actualStartDate}
              onChange={(e) => setActualStartDate(e.target.value)}
            />
            <TextInput
              label="实际结束时间"
              type="date"
              value={actualEndDate}
              onChange={(e) => setActualEndDate(e.target.value)}
            />
          </SimpleGrid>
        )}

        {/* 第八行：年份 + 周数（必填） */}
        <Group grow align="flex-end">
          <NumberInput
            label="年份"
            value={year}
            onChange={(val) => setYear(Number(val))}
            min={2000}
            max={2100}
            required
          />
          <NumberInput
            label={
              <Group style={{display: 'inline'}}>
                <span>周数</span>
                <Text span size="xs" c="dimmed">({getWeekDateRange(year, weekNumber)})</Text>
              </Group>
            }
            value={weekNumber}
            onChange={(val) => setWeekNumber(Number(val))}
            min={1}
            max={53}
            required
          />
        </Group>

        {/* 最后一行：备注（非必填，富文本框，最多500字） */}
        <Textarea
          label="备注"
          placeholder="请输入备注"
          value={remark}
          onChange={(e) => setRemark(e.target.value.slice(0, 500))}
          minRows={3}
          maxLength={500}
          description={`${remark.length}/500`}
        />

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="default" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" loading={loading}>
            {isEdit ? '更新' : '提交'}
          </Button>
        </Group>
      </Stack>
    </form>
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
