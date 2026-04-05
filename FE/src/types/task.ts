export interface Task {
  id: number;
  project: string;
  usDts?: string;
  usDtsLink?: string;
  taskDetail: string;
  progress: number;
  estimatedWorkload: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualWorkload: number;
  weeklyWorkload: number;
  plannedWeeklyWorkload: number;
  actualStartDate?: string;
  actualEndDate?: string;
  assignee?: string;
  remark?: string;
  weekNumber: number;
  year: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  project: string;
  usDts?: string;
  usDtsLink?: string;
  taskDetail: string;
  progress?: number;
  estimatedWorkload?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualWorkload?: number;
  weeklyWorkload?: number;
  plannedWeeklyWorkload: number;
  actualStartDate?: string;
  actualEndDate?: string;
  assignee?: string;
  remark?: string;
  weekNumber: number;
  year: number;
  userId?: string;
}

export interface UpdateTaskDto {
  project?: string;
  usDts?: string;
  usDtsLink?: string;
  taskDetail?: string;
  progress?: number;
  estimatedWorkload?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualWorkload?: number;
  weeklyWorkload?: number;
  plannedWeeklyWorkload?: number;
  actualStartDate?: string;
  actualEndDate?: string;
  assignee?: string;
  remark?: string;
  weekNumber?: number;
  year?: number;
  userId?: string;
}

export interface QueryTaskDto {
  year?: number;
  weekNumber?: number;
  project?: string;
}

export interface WeeklySummary {
  totalTasks: number;
  totalEstimatedWorkload: number;
  totalActualWorkload: number;
  totalWeeklyWorkload: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  tasks: Task[];
}

export enum CopyMode {
  SELF = 'SELF',
  ALL = 'ALL',
  SPECIFIC_USER = 'SPECIFIC_USER',
}

export interface CopyTaskDto {
  year: number;
  weekNumber: number;
  copyMode?: CopyMode;
  userId?: number;
}

export interface CopyTaskResult {
  copiedCount: number;
  skippedCount: number;
  skippedTasks: Array<{ task: string; reason: string }>;
}
