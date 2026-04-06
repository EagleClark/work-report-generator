import { User, UserRole } from '../../src/types/user';
import { Task } from '../../src/types/task';

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'superadmin',
    role: UserRole.SUPER_ADMIN,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    username: 'admin',
    role: UserRole.ADMIN,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    username: 'user1',
    role: UserRole.USER,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 4,
    username: 'user2',
    role: UserRole.USER,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// 模拟项目数据
export const mockProjects = [
  { id: 1, name: '项目A', description: '项目A描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: '项目B', description: '项目B描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, name: '项目C', description: '项目C描述', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

// 模拟任务数据
export const mockTasks: Task[] = [
  {
    id: 1,
    project: '项目A',
    usDts: 'US-001',
    usDtsLink: 'https://example.com/us/001',
    taskDetail: '实现用户登录功能',
    progress: 100,
    estimatedWorkload: 5,
    plannedStartDate: '2024-01-01',
    plannedEndDate: '2024-01-05',
    actualWorkload: 6,
    weeklyWorkload: 3,
    plannedWeeklyWorkload: 2,
    actualStartDate: '2024-01-01',
    actualEndDate: '2024-01-06',
    assignee: 'user1',
    userId: '3',
    weekNumber: 1,
    year: 2024,
    remark: '测试备注',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-06T00:00:00.000Z',
  },
  {
    id: 2,
    project: '项目A',
    usDts: 'US-002',
    taskDetail: '实现用户注册功能',
    progress: 50,
    estimatedWorkload: 4,
    plannedStartDate: '2024-01-03',
    plannedEndDate: '2024-01-06',
    actualWorkload: 2,
    weeklyWorkload: 2,
    plannedWeeklyWorkload: 2,
    actualStartDate: '2024-01-03',
    assignee: 'user1',
    userId: '3',
    weekNumber: 1,
    year: 2024,
    remark: '',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 3,
    project: '项目B',
    usDts: 'DTS-001',
    usDtsLink: 'https://example.com/dts/001',
    taskDetail: '修复登录页面Bug',
    progress: 0,
    estimatedWorkload: 2,
    plannedStartDate: '2024-01-08',
    plannedEndDate: '2024-01-09',
    actualWorkload: 0,
    weeklyWorkload: 0,
    plannedWeeklyWorkload: 2,
    assignee: 'user2',
    userId: '4',
    weekNumber: 2,
    year: 2024,
    remark: '等待分配',
    createdAt: '2024-01-08T00:00:00.000Z',
    updatedAt: '2024-01-08T00:00:00.000Z',
  },
];

// 模拟AI分析数据
export const mockAIAnalysis = {
  id: 1,
  year: 2024,
  weekNumber: 1,
  analysisContent: '## 工作总结\n\n### user1\n本周投入3人天，完成任务1。\n\n### 团队整体压力\n团队整体压力适中。',
  userPrompt: '重点关注进度偏差',
  modelType: 'OPENAI',
  modelName: 'gpt-4o-mini',
  metadata: { tokenCount: 500, generationTime: 3.5 },
  createdAt: '2024-01-07T00:00:00.000Z',
  updatedAt: '2024-01-07T00:00:00.000Z',
};

// 模拟周报汇总数据
export const mockWeeklySummary = {
  totalTasks: 3,
  totalEstimatedWorkload: 11,
  totalActualWorkload: 8,
  totalWeeklyWorkload: 5,
  totalPlannedWeeklyWorkload: 6,
  completedTasks: 1,
  inProgressTasks: 1,
  notStartedTasks: 1,
  tasks: mockTasks,
  assigneeStats: [
    { assignee: 'user1', weeklyWorkload: 5, plannedWeeklyWorkload: 4 },
    { assignee: 'user2', weeklyWorkload: 0, plannedWeeklyWorkload: 2 },
  ],
};

// 模拟登录响应
export const mockLoginResponse = {
  access_token: 'mock-jwt-token-12345',
  user: mockUsers[1], // admin用户
};

// 模拟过期token
export const mockExpiredToken = 'expired-token';

// 模拟有效token
export const mockValidToken = 'valid-token-' + (Date.now() + 3600000);