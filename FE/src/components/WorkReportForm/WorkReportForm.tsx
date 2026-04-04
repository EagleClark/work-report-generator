import { useState } from 'react';
import { TextInput, Textarea, NumberInput, Button, Group, Stack } from '@mantine/core';
import type { CreateWorkReportDto, WorkReport } from '../../types/work-report';

interface WorkReportFormProps {
  onSubmit: (dto: CreateWorkReportDto) => Promise<void>;
  onCancel?: () => void;
  initialData?: WorkReport;
  isEdit?: boolean;
}

export function WorkReportForm({ onSubmit, onCancel, initialData, isEdit }: WorkReportFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [year, setYear] = useState(initialData?.year || new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState(initialData?.weekNumber || getCurrentWeekNumber());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ title, content, year, weekNumber });
      if (!isEdit) {
        setTitle('');
        setContent('');
        setYear(new Date().getFullYear());
        setWeekNumber(getCurrentWeekNumber());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="标题"
          placeholder="请输入周报标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          label="工作内容"
          placeholder="请输入本周工作内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          minRows={5}
          required
        />
        <Group grow>
          <NumberInput
            label="年份"
            value={year}
            onChange={(val) => setYear(Number(val))}
            min={2000}
            max={2100}
            required
          />
          <NumberInput
            label="周数"
            value={weekNumber}
            onChange={(val) => setWeekNumber(Number(val))}
            min={1}
            max={53}
            required
          />
        </Group>
        <Group justify="flex-end">
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
