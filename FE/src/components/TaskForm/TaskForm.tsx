import { useState } from 'react';
import { TextInput, Textarea, NumberInput, Button, Group, Stack, SimpleGrid, Grid } from '@mantine/core';
import type { CreateTaskDto, Task } from '../../types/task';

interface TaskFormProps {
  onSubmit: (dto: CreateTaskDto) => Promise<void>;
  onCancel?: () => void;
  initialData?: Task;
  isEdit?: boolean;
}

export function TaskForm({ onSubmit, onCancel, initialData, isEdit }: TaskFormProps) {
  const [project, setProject] = useState(initialData?.project || '');
  const [usDts, setUsDts] = useState(initialData?.usDts || '');
  const [taskDetail, setTaskDetail] = useState(initialData?.taskDetail || '');
  const [progress, setProgress] = useState(initialData?.progress || 0);
  const [estimatedWorkload, setEstimatedWorkload] = useState(initialData?.estimatedWorkload || 0);
  const [plannedStartDate, setPlannedStartDate] = useState(initialData?.plannedStartDate || '');
  const [plannedEndDate, setPlannedEndDate] = useState(initialData?.plannedEndDate || '');
  const [actualWorkload, setActualWorkload] = useState(initialData?.actualWorkload || 0);
  const [weeklyWorkload, setWeeklyWorkload] = useState(initialData?.weeklyWorkload || 0);
  const [actualStartDate, setActualStartDate] = useState(initialData?.actualStartDate || '');
  const [actualEndDate, setActualEndDate] = useState(initialData?.actualEndDate || '');
  const [assignee, setAssignee] = useState(initialData?.assignee || '');
  const [remark, setRemark] = useState(initialData?.remark || '');
  const [year, setYear] = useState(initialData?.year || new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState(initialData?.weekNumber || getCurrentWeekNumber());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        project,
        usDts,
        taskDetail,
        progress,
        estimatedWorkload,
        plannedStartDate,
        plannedEndDate,
        actualWorkload,
        weeklyWorkload,
        actualStartDate,
        actualEndDate,
        assignee,
        remark,
        year,
        weekNumber,
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
    setUsDts('');
    setTaskDetail('');
    setProgress(0);
    setEstimatedWorkload(0);
    setPlannedStartDate('');
    setPlannedEndDate('');
    setActualWorkload(0);
    setWeeklyWorkload(0);
    setActualStartDate('');
    setActualEndDate('');
    setAssignee('');
    setRemark('');
    setYear(new Date().getFullYear());
    setWeekNumber(getCurrentWeekNumber());
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="项目"
            placeholder="请输入项目名称"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            required
          />
          <TextInput
            label="US/DTS"
            placeholder="请输入US/DTS编号"
            value={usDts}
            onChange={(e) => setUsDts(e.target.value)}
          />
        </SimpleGrid>

        <Textarea
          label="任务详情"
          placeholder="请输入任务详情"
          value={taskDetail}
          onChange={(e) => setTaskDetail(e.target.value)}
          minRows={3}
          required
        />

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <NumberInput
            label="当前进度 (%)"
            value={progress}
            onChange={(val) => setProgress(Number(val) || 0)}
            min={0}
            max={100}
          />
          <NumberInput
            label="预计工作量 (人天)"
            value={estimatedWorkload}
            onChange={(val) => setEstimatedWorkload(Number(val) || 0)}
            min={0}
          />
          <TextInput
            label="责任人"
            placeholder="请输入责任人"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="计划开始时间"
            type="date"
            value={plannedStartDate}
            onChange={(e) => setPlannedStartDate(e.target.value)}
          />
          <TextInput
            label="计划结束时间"
            type="date"
            value={plannedEndDate}
            onChange={(e) => setPlannedEndDate(e.target.value)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <NumberInput
            label="实际工作量 (人天)"
            value={actualWorkload}
            onChange={(val) => setActualWorkload(Number(val) || 0)}
            min={0}
          />
          <NumberInput
            label="本周工作量 (人天)"
            value={weeklyWorkload}
            onChange={(val) => setWeeklyWorkload(Number(val) || 0)}
            min={0}
          />
          <NumberInput
            label="年份"
            value={year}
            onChange={(val) => setYear(Number(val))}
            min={2000}
            max={2100}
            required
          />
        </SimpleGrid>

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

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <NumberInput
            label="周数"
            value={weekNumber}
            onChange={(val) => setWeekNumber(Number(val))}
            min={1}
            max={53}
            required
          />
          <Textarea
            label="备注"
            placeholder="请输入备注"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            minRows={1}
          />
        </SimpleGrid>

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
