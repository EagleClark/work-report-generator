import { useState, useEffect } from 'react';
import { TextInput, Textarea, NumberInput, Button, Group, Stack, SimpleGrid, Text, Select, Alert } from '@mantine/core';
import type { CreateTaskDto, Task } from '../../types/task';
import { UserRole, type User } from '../../types/user';
import type { Project } from '../../services/project.api';

interface TaskFormProps {
  onSubmit: (dto: CreateTaskDto) => Promise<void>;
  onCancel?: () => void;
  initialData?: Task;
  isEdit?: boolean;
  currentUser?: { id: number; username: string; role: UserRole } | null;
  users?: User[];
  projects?: Project[];
  defaultYear?: number;
  defaultWeekNumber?: number;
}

interface FormErrors {
  project?: string;
  assignee?: string;
  taskDetail?: string;
  estimatedWorkload?: string;
  plannedWeeklyWorkload?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  usDtsLink?: string;
  progress?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  actualWorkload?: string;
  weeklyWorkload?: string;
}

// 验证URL是否有效
function isValidUrl(url: string): boolean {
  if (!url) return true; // 空值允许
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function TaskForm({ onSubmit, onCancel, initialData, isEdit, currentUser, users, projects, defaultYear, defaultWeekNumber }: TaskFormProps) {
  // 普通用户和管理员创建任务时，负责人默认为当前用户；超管不默认选中
  const isRegularUser = currentUser?.role === UserRole.USER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // 编辑模式使用原数据，新增模式下：普通用户和管理员默认选中自己，超管不选中
  let defaultAssignee = initialData?.assignee || '';
  if (!isEdit) {
    if (isRegularUser || isAdmin) {
      defaultAssignee = currentUser?.username || '';
    }
    // 超管不默认选中任何人
  }

  // 生成责任人下拉选项（排除超管，确保当前用户在选项中）
  const assigneeOptions = (users || [])
    .filter(u => u.role !== UserRole.SUPER_ADMIN)
    .map(u => ({ value: u.username, label: u.username }));

  // 如果当前用户不在选项中，添加进去
  if (currentUser?.username && currentUser.role !== UserRole.SUPER_ADMIN) {
    if (!assigneeOptions.some(opt => opt.value === currentUser.username)) {
      assigneeOptions.push({ value: currentUser.username, label: currentUser.username });
    }
  }

  // 生成项目下拉选项
  const projectOptions = (projects || [])
    .map(p => ({ value: p.name, label: p.name }));

  const [project, setProject] = useState(initialData?.project || '');
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [usDts, setUsDts] = useState(initialData?.usDts || '');
  const [usDtsLink, setUsDtsLink] = useState(initialData?.usDtsLink || '');
  const [taskDetail, setTaskDetail] = useState(initialData?.taskDetail || '');
  const [progress, setProgress] = useState(initialData?.progress || 0);
  const [estimatedWorkload, setEstimatedWorkload] = useState(initialData?.estimatedWorkload || 0);
  const [plannedStartDate, setPlannedStartDate] = useState(initialData?.plannedStartDate || '');
  const [plannedEndDate, setPlannedEndDate] = useState(initialData?.plannedEndDate || '');
  const [actualWorkload, setActualWorkload] = useState(initialData?.actualWorkload || 0);
  const [weeklyWorkload, setWeeklyWorkload] = useState(initialData?.weeklyWorkload || 0);
  const [plannedWeeklyWorkload, setPlannedWeeklyWorkload] = useState(initialData?.plannedWeeklyWorkload || 0);
  const [actualStartDate, setActualStartDate] = useState(initialData?.actualStartDate || '');
  const [actualEndDate, setActualEndDate] = useState(initialData?.actualEndDate || '');
  const [year, setYear] = useState(initialData?.year || defaultYear || new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState(initialData?.weekNumber || defaultWeekNumber || getCurrentWeekNumber());
  const [remark, setRemark] = useState(initialData?.remark || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // 用于提醒同步修改实际工作量
  const [weeklyWorkloadModified, setWeeklyWorkloadModified] = useState(false);
  const [initialActualWorkload, setInitialActualWorkload] = useState(initialData?.actualWorkload || 0);

  // 用于跟踪进度是否被手动修改
  const [progressManuallyModified, setProgressManuallyModified] = useState(false);

  // 用于跟踪实际工作量和预计工作量是否被修改（用于判断是否自动计算进度）
  const initialEstimatedWorkload = initialData?.estimatedWorkload || 0;
  const [workloadModified, setWorkloadModified] = useState(false);

  // 计算建议进度（实际工作量/预计工作量，限制在0-100之间）
  const calculateSuggestedProgress = (actual: number, estimated: number): number => {
    if (estimated <= 0) return 0;
    const calculated = Math.round((actual / estimated) * 100);
    return Math.min(100, Math.max(0, calculated));
  };

  // 当实际工作量或预计工作量变化时，自动更新进度（仅当工作量被修改且进度未被手动修改时）
  useEffect(() => {
    if (isEdit && workloadModified && !progressManuallyModified) {
      const suggestedProgress = calculateSuggestedProgress(actualWorkload, estimatedWorkload);
      setProgress(suggestedProgress);
    }
  }, [actualWorkload, estimatedWorkload, isEdit, workloadModified, progressManuallyModified]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 必填字段验证
    if (!project.trim()) {
      newErrors.project = '项目名称不能为空';
    }
    if (!assignee.trim()) {
      newErrors.assignee = '责任人不能为空';
    }
    if (!taskDetail.trim()) {
      newErrors.taskDetail = '任务详情不能为空';
    }

    // 预计工作量不能为0
    if (estimatedWorkload <= 0) {
      newErrors.estimatedWorkload = '预计工作量必须大于0';
    }

    // 计划时间验证：开始时间不能晚于结束时间
    if (plannedStartDate && plannedEndDate && plannedStartDate > plannedEndDate) {
      newErrors.plannedStartDate = '计划开始时间不能晚于结束时间';
      newErrors.plannedEndDate = '计划结束时间不能早于开始时间';
    }

    // US/DTS链接验证
    if (usDtsLink && !isValidUrl(usDtsLink)) {
      newErrors.usDtsLink = '请输入有效的URL链接';
    }

    // 编辑模式下的额外验证
    if (isEdit) {
      // 进度不为0时，实际开始时间、实际工作量、本周工作量必填
      if (progress > 0) {
        if (!actualStartDate) {
          newErrors.actualStartDate = '进度不为0时必须填写实际开始时间';
        }
        if (!actualWorkload || actualWorkload <= 0) {
          newErrors.actualWorkload = '进度不为0时必须填写实际工作量';
        }
        if (weeklyWorkload === undefined || weeklyWorkload === null) {
          newErrors.weeklyWorkload = '进度不为0时必须填写本周工作量';
        }
      }

      // 进度100%时，必须填入实际结束时间
      if (progress === 100) {
        if (!actualEndDate) {
          newErrors.actualEndDate = '进度100%时必须填写实际结束时间';
        }
      }

      // 进度小于100%时，实际结束时间不应填写
      if (progress < 100 && actualEndDate) {
        newErrors.actualEndDate = '进度未完成时不应填写实际结束时间';
      }

      // 实际开始和结束时间验证
      if (actualStartDate && actualEndDate && actualStartDate > actualEndDate) {
        newErrors.actualStartDate = '实际开始时间不能晚于结束时间';
        newErrors.actualEndDate = '实际结束时间不能早于开始时间';
      }

      // 实际工作量不能小于本周工作量
      if (actualWorkload > 0 && weeklyWorkload > actualWorkload) {
        newErrors.weeklyWorkload = '本周工作量不能大于实际工作量';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const submitData: CreateTaskDto = {
        project,
        assignee,
        usDts,
        taskDetail,
        estimatedWorkload,
        plannedWeeklyWorkload,
        plannedStartDate,
        plannedEndDate,
        year,
        weekNumber,
        remark,
        usDtsLink: usDtsLink || undefined,
      };

      // 编辑时才添加进度和实际工作相关字段
      if (isEdit) {
        submitData.progress = progress;
        if (actualWorkload !== undefined && actualWorkload !== null) submitData.actualWorkload = actualWorkload;
        if (weeklyWorkload !== undefined && weeklyWorkload !== null) submitData.weeklyWorkload = weeklyWorkload;
        if (actualStartDate && actualStartDate.trim()) submitData.actualStartDate = actualStartDate;
        if (actualEndDate && actualEndDate.trim()) submitData.actualEndDate = actualEndDate;
      }

      await onSubmit(submitData);
      if (!isEdit) {
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProject('');
    setAssignee(defaultAssignee);
    setUsDts('');
    setUsDtsLink('');
    setTaskDetail('');
    setProgress(0);
    setEstimatedWorkload(0);
    setPlannedWeeklyWorkload(0);
    setPlannedStartDate('');
    setPlannedEndDate('');
    setActualWorkload(0);
    setWeeklyWorkload(0);
    setActualStartDate('');
    setActualEndDate('');
    setRemark('');
    setYear(defaultYear || new Date().getFullYear());
    setWeekNumber(defaultWeekNumber || getCurrentWeekNumber());
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* 第一行：项目 + 责任人（必填） */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="项目"
            placeholder="请选择项目"
            data={projectOptions}
            value={project}
            onChange={(value) => { setProject(value || ''); clearError('project'); }}
            required
            error={errors.project}
            searchable
          />
          <Select
            label="责任人"
            placeholder="请选择责任人"
            data={assigneeOptions}
            value={assignee}
            onChange={(value) => { setAssignee(value || ''); clearError('assignee'); }}
            required
            error={errors.assignee}
            searchable
            disabled={isRegularUser && !isEdit}
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
            value={usDtsLink}
            onChange={(e) => { setUsDtsLink(e.target.value); clearError('usDtsLink'); }}
            error={errors.usDtsLink}
          />
        </SimpleGrid>

        {/* 第三行：任务详情（必填，富文本框，最多200字符） */}
        <Textarea
          label="任务详情"
          placeholder="请输入任务详情"
          value={taskDetail}
          onChange={(e) => { setTaskDetail(e.target.value.slice(0, 200)); clearError('taskDetail'); }}
          minRows={3}
          maxLength={200}
          required
          description={`${taskDetail.length}/200`}
          error={errors.taskDetail}
        />

        {/* 第四行：预计工作量 + 计划本周工作量（新增时必填） */}
        {isEdit ? (
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <NumberInput
              label={
                <Group style={{display: 'inline'}}>
                  <span>当前进度</span>
                  {workloadModified && !progressManuallyModified && (
                    <Text span size="xs" c="dimmed">(建议: {calculateSuggestedProgress(actualWorkload, estimatedWorkload)}%)</Text>
                  )}
                  {progressManuallyModified && (
                    <Text span size="xs" c="orange">(已手动调整)</Text>
                  )}
                </Group>
              }
              suffix=" %"
              value={progress}
              onChange={(val) => {
                setProgress(Number(val) || 0);
                setProgressManuallyModified(true);
                clearError('progress');
                clearError('actualStartDate');
                clearError('actualEndDate');
              }}
              min={0}
              max={100}
              required
              error={errors.progress}
            />
            <NumberInput
              label="预计工作量"
              suffix=" 人天"
              value={estimatedWorkload}
              onChange={(val) => { setEstimatedWorkload(Number(val) || 0); clearError('estimatedWorkload'); setWorkloadModified(true); }}
              min={0}
              required
              error={errors.estimatedWorkload}
            />
            <NumberInput
              label="计划本周投入"
              suffix=" 人天"
              value={plannedWeeklyWorkload}
              onChange={(val) => { setPlannedWeeklyWorkload(Number(val) || 0); clearError('plannedWeeklyWorkload'); }}
              min={0}
              required
              error={errors.plannedWeeklyWorkload}
            />
          </SimpleGrid>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="预计工作量"
              suffix=" 人天"
              value={estimatedWorkload}
              onChange={(val) => { setEstimatedWorkload(Number(val) || 0); clearError('estimatedWorkload'); }}
              min={0}
              required
              error={errors.estimatedWorkload}
            />
            <NumberInput
              label="计划本周投入"
              suffix=" 人天"
              value={plannedWeeklyWorkload}
              onChange={(val) => { setPlannedWeeklyWorkload(Number(val) || 0); clearError('plannedWeeklyWorkload'); }}
              min={0}
              required
              error={errors.plannedWeeklyWorkload}
            />
          </SimpleGrid>
        )}

        {/* 第五行：计划开始时间 + 计划结束时间（必填） */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="计划开始时间"
            type="date"
            value={plannedStartDate}
            onChange={(e) => { setPlannedStartDate(e.target.value); clearError('plannedStartDate'); }}
            required
            error={errors.plannedStartDate}
          />
          <TextInput
            label="计划结束时间"
            type="date"
            value={plannedEndDate}
            onChange={(e) => { setPlannedEndDate(e.target.value); clearError('plannedEndDate'); }}
            required
            error={errors.plannedEndDate}
          />
        </SimpleGrid>

        {/* 第六行：实际工作量 + 本周工作量（编辑时显示） */}
        {isEdit && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <NumberInput
                label="实际工作量"
                suffix=" 人天"
                value={actualWorkload}
                onChange={(val) => {
                  setActualWorkload(Number(val) || 0);
                  clearError('actualWorkload');
                  clearError('weeklyWorkload');
                  setWeeklyWorkloadModified(false);
                  setWorkloadModified(true);
                }}
                min={0}
                error={errors.actualWorkload}
                description={progress > 0 ? '进度不为0时必填' : ''}
              />
              <NumberInput
                label="本周工作量"
                suffix=" 人天"
                value={weeklyWorkload}
                onChange={(val) => {
                  setWeeklyWorkload(Number(val) || 0);
                  clearError('weeklyWorkload');
                  setWeeklyWorkloadModified(true);
                }}
                min={0}
                error={errors.weeklyWorkload}
                description={progress > 0 ? '进度不为0时必填（可为0）' : ''}
              />
            </SimpleGrid>
            {/* 提醒同步修改实际工作量 */}
            {weeklyWorkloadModified && actualWorkload === initialActualWorkload && (
              <Alert color="yellow" variant="light" title="提示">
                本周工作量已修改，请确认是否需要同步更新实际工作量
              </Alert>
            )}
          </>
        )}

        {/* 第七行：实际开始时间 + 实际结束时间（编辑时显示） */}
        {isEdit && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="实际开始时间"
              type="date"
              value={actualStartDate}
              onChange={(e) => { setActualStartDate(e.target.value); clearError('actualStartDate'); }}
              error={errors.actualStartDate}
              description={progress > 0 ? '进度不为0时必填' : ''}
            />
            <TextInput
              label="实际结束时间"
              type="date"
              value={actualEndDate}
              onChange={(e) => { setActualEndDate(e.target.value); clearError('actualEndDate'); }}
              error={errors.actualEndDate}
              description={progress === 100 ? '进度100%时必填' : progress < 100 ? '进度未完成时不需填写' : ''}
              disabled={progress < 100}
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