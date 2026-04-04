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
