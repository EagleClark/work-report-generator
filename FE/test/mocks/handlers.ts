import { http, HttpResponse, delay } from 'msw';
import { mockUsers, mockProjects, mockTasks, mockAIAnalysis, mockWeeklySummary, mockLoginResponse } from './data';

// API基础路径（完整URL）
const API_BASE = 'http://localhost:3001/api';

// 认证相关 handlers
export const authHandlers = [
  // 登录
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string };

    // 模拟验证
    const user = mockUsers.find(u => u.username === body.username);
    if (user && body.password === 'password123') {
      return HttpResponse.json({
        access_token: `mock-token-${user.id}`,
        user,
      });
    }

    return HttpResponse.json(
      { message: '用户名或密码错误', statusCode: 401 },
      { status: 401 }
    );
  }),

  // 获取当前用户
  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: '未授权', statusCode: 401 },
        { status: 401 }
      );
    }
    return HttpResponse.json(mockUsers[1]); // 返回admin用户
  }),

  // 修改密码
  http.post(`${API_BASE}/auth/change-password`, async ({ request }) => {
    const body = await request.json() as { oldPassword: string; newPassword: string };
    if (body.oldPassword === 'password123') {
      return HttpResponse.json({ message: '密码修改成功' });
    }
    return HttpResponse.json(
      { message: '原密码错误', statusCode: 400 },
      { status: 400 }
    );
  }),
];

// 任务相关 handlers - 注意：静态路由必须在动态路由之前定义
export const taskHandlers = [
  // 获取周报汇总 - 必须放在 :id 路由之前
  http.get(`${API_BASE}/tasks/summary`, ({ request }) => {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const weekNumber = url.searchParams.get('weekNumber');

    return HttpResponse.json({
      ...mockWeeklySummary,
      year: year ? parseInt(year) : 2024,
      weekNumber: weekNumber ? parseInt(weekNumber) : 1,
    });
  }),

  // 获取任务列表
  http.get(`${API_BASE}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const weekNumber = url.searchParams.get('weekNumber');
    const project = url.searchParams.get('project');

    let filtered = [...mockTasks];
    if (year) filtered = filtered.filter(t => t.year === parseInt(year));
    if (weekNumber) filtered = filtered.filter(t => t.weekNumber === parseInt(weekNumber));
    if (project) filtered = filtered.filter(t => t.project === project);

    return HttpResponse.json(filtered);
  }),

  // 获取单个任务
  http.get(`${API_BASE}/tasks/:id`, ({ params }) => {
    const task = mockTasks.find(t => t.id === Number(params.id));
    if (task) {
      return HttpResponse.json(task);
    }
    return HttpResponse.json(
      { message: '任务不存在', statusCode: 404 },
      { status: 404 }
    );
  }),

  // 创建任务
  http.post(`${API_BASE}/tasks`, async ({ request }) => {
    const body = await request.json();
    const newTask = {
      id: mockTasks.length + 1,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTasks.push(newTask as any);
    return HttpResponse.json(newTask, { status: 201 });
  }),

  // 更新任务
  http.put(`${API_BASE}/tasks/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const index = mockTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const body = await request.json();
      mockTasks[index] = {
        ...mockTasks[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      return HttpResponse.json(mockTasks[index]);
    }
    return HttpResponse.json(
      { message: '任务不存在', statusCode: 404 },
      { status: 404 }
    );
  }),

  // 删除任务
  http.delete(`${API_BASE}/tasks/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTasks.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json(
      { message: '任务不存在', statusCode: 404 },
      { status: 404 }
    );
  }),

  // 复制任务
  http.post(`${API_BASE}/tasks/copy`, async ({ request }) => {
    await delay(100);
    return HttpResponse.json({
      copiedCount: 2,
      skippedCount: 1,
      skippedTasks: [
        { task: '任务1', reason: '已存在相同任务' },
      ],
    });
  }),
];

// 用户相关 handlers
export const userHandlers = [
  // 获取用户列表
  http.get(`${API_BASE}/users`, () => {
    return HttpResponse.json(mockUsers);
  }),

  // 获取单个用户
  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    const user = mockUsers.find(u => u.id === Number(params.id));
    if (user) {
      return HttpResponse.json(user);
    }
    return HttpResponse.json(
      { message: '用户不存在', statusCode: 404 },
      { status: 404 }
    );
  }),

  // 创建用户
  http.post(`${API_BASE}/users`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string; role?: string };
    const newUser = {
      id: mockUsers.length + 1,
      username: body.username,
      role: body.role || 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // 更新用户
  http.put(`${API_BASE}/users/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const user = mockUsers.find(u => u.id === id);
    if (user) {
      const body = await request.json();
      Object.assign(user, body, { updatedAt: new Date().toISOString() });
      return HttpResponse.json(user);
    }
    return HttpResponse.json(
      { message: '用户不存在', statusCode: 404 },
      { status: 404 }
    );
  }),

  // 删除用户
  http.delete(`${API_BASE}/users/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json(
      { message: '用户不存在', statusCode: 404 },
      { status: 404 }
    );
  }),
];

// 项目相关 handlers
export const projectHandlers = [
  // 获取项目列表
  http.get(`${API_BASE}/projects`, () => {
    return HttpResponse.json(mockProjects);
  }),

  // 获取单个项目
  http.get(`${API_BASE}/projects/:id`, ({ params }) => {
    const project = mockProjects.find(p => p.id === Number(params.id));
    if (project) {
      return HttpResponse.json(project);
    }
    return HttpResponse.json(
      { message: '项目不存在', statusCode: 404 },
      { status: 404 }
    );
  }),

  // 创建项目
  http.post(`${API_BASE}/projects`, async ({ request }) => {
    const body = await request.json() as { name: string; description?: string };
    const newProject = {
      id: mockProjects.length + 1,
      name: body.name,
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProjects.push(newProject);
    return HttpResponse.json(newProject, { status: 201 });
  }),

  // 更新项目
  http.put(`${API_BASE}/projects/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const project = mockProjects.find(p => p.id === id);
    if (project) {
      const body = await request.json();
      Object.assign(project, body, { updatedAt: new Date().toISOString() });
      return HttpResponse.json(project);
    }
    return HttpResponse.json(
      { message: '项目不存在', statusCode: 404 },
      { status: 404 }
    );
  }),

  // 删除项目
  http.delete(`${API_BASE}/projects/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProjects.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json(
      { message: '项目不存在', statusCode: 404 },
      { status: 404 }
    );
  }),
];

// AI分析相关 handlers
export const aiAnalysisHandlers = [
  // 获取当前分析
  http.get(`${API_BASE}/ai-analysis/current`, ({ request }) => {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const weekNumber = url.searchParams.get('weekNumber');

    if (year === '2024' && weekNumber === '1') {
      return HttpResponse.json(mockAIAnalysis);
    }
    return HttpResponse.json(null);
  }),

  // 获取分析列表
  http.get(`${API_BASE}/ai-analysis`, () => {
    return HttpResponse.json([mockAIAnalysis]);
  }),

  // 生成分析
  http.post(`${API_BASE}/ai-analysis/generate`, async () => {
    await delay(500);
    return HttpResponse.json(mockAIAnalysis);
  }),

  // 流式生成分析
  http.post(`${API_BASE}/ai-analysis/generate-stream`, async () => {
    const stream = new ReadableStream({
      start(controller) {
        const text = '## 工作总结\n\n本周工作进展顺利。\n\n### 建议与改进\n建议继续保持。';
        const encoder = new TextEncoder();
        let i = 0;
        const interval = setInterval(() => {
          if (i < text.length) {
            controller.enqueue(encoder.encode(text[i]));
            i++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 10);
      },
    });
    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
  }),

  // 删除分析
  http.delete(`${API_BASE}/ai-analysis/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === mockAIAnalysis.id) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json(
      { message: '分析不存在', statusCode: 404 },
      { status: 404 }
    );
  }),
];

// 合并所有handlers
export const handlers = [
  ...authHandlers,
  ...taskHandlers,
  ...userHandlers,
  ...projectHandlers,
  ...aiAnalysisHandlers,
];