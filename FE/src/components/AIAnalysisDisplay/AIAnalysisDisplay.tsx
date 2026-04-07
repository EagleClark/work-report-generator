import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Paper, Text, Stack, Group, Badge, Button, ScrollArea, ActionIcon, Alert, Box, Loader
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconTrash, IconSparkles } from '@tabler/icons-react';
import type { AIAnalysis } from '../../types/ai-analysis';
import { AIAnalysisModal } from '../AIAnalysisModal/AIAnalysisModal';
import { useAuth } from '../../context/AuthContext';
import { useAIAnalysisState } from '../../context/AIAnalysisContext';
import { UserRole } from '../../types/user';

interface GeneratingStatus {
  isGenerating: boolean;
  year: number | null;
  weekNumber: number | null;
  partialContent: string;
}

interface AIAnalysisDisplayProps {
  year: number;
  weekNumber: number;
}

export function AIAnalysisDisplay({ year, weekNumber }: AIAnalysisDisplayProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const { user, hasRole } = useAuth();

  // 本地流式内容
  const { localStreamContent, setLocalStreamContent, appendLocalStreamContent } = useAIAnalysisState();

  // 用于存储当前正在生成的 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 是否为管理员
  const isAdmin = hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  // 检查当前周是否正在分析中
  const isCurrentWeekGenerating = generatingStatus?.isGenerating &&
    generatingStatus.year === year &&
    generatingStatus.weekNumber === weekNumber;

  // 查询生成状态
  const fetchGeneratingStatus = async (): Promise<GeneratingStatus | null> => {
    try {
      const res = await fetch('/api/ai-analysis/generating-status');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.error('Failed to fetch generating status:', error);
    }
    return null;
  };

  // 查询分析数据
  const fetchAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/ai-analysis/current?year=${year}&weekNumber=${weekNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化：先检查生成状态，再决定是否加载分析数据
  useEffect(() => {
    const init = async () => {
      const status = await fetchGeneratingStatus();
      setGeneratingStatus(status);

      // 如果当前周正在生成，使用partialContent
      if (status?.isGenerating && status.year === year && status.weekNumber === weekNumber) {
        setStreamContent(status.partialContent || '');
        setLoading(false);
      } else {
        // 否则加载分析数据
        await fetchAnalysis();
      }
    };

    init();
  }, [year, weekNumber]);

  // 如果正在生成当前周，定期轮询状态更新partialContent
  useEffect(() => {
    if (!isCurrentWeekGenerating) return;

    const interval = setInterval(async () => {
      const status = await fetchGeneratingStatus();
      setGeneratingStatus(status);
      if (status?.isGenerating && status.year === year && status.weekNumber === weekNumber) {
        setStreamContent(status.partialContent || '');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCurrentWeekGenerating, year, weekNumber]);

  // 当生成完成时，重新加载数据
  useEffect(() => {
    if (generatingStatus && !generatingStatus.isGenerating && streamContent) {
      // 生成刚刚完成，重新加载
      fetchAnalysis();
      setStreamContent('');
    }
  }, [generatingStatus?.isGenerating]);

  // SSE 流式生成分析
  const generateWithSSE = useCallback(async (userPrompt?: string) => {
    // 先检查是否正在生成
    const status = await fetchGeneratingStatus();
    if (status?.isGenerating) {
      notifications.show({
        title: '提示',
        message: '正在生成分析中，请稍后再试',
        color: 'yellow',
      });
      return;
    }

    setAnalysis(null);
    setLocalStreamContent('');
    setStreamContent('');
    setGeneratingStatus({ isGenerating: true, year, weekNumber, partialContent: '' });

    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai-analysis/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          year,
          weekNumber,
          userPrompt: userPrompt || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '生成失败');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        appendLocalStreamContent(chunk);
        setStreamContent(prev => prev + chunk);
      }

      // 完成后重新加载
      await fetchAnalysis();
      setGeneratingStatus(null);
      setStreamContent('');

      notifications.show({
        title: '生成成功',
        message: 'AI 分析已完成',
        color: 'green',
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      setGeneratingStatus(null);
      notifications.show({
        title: '生成失败',
        message: error.message || '请检查 AI 配置或稍后重试',
        color: 'red',
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, [year, weekNumber, setLocalStreamContent, appendLocalStreamContent]);

  const handleDelete = async () => {
    if (!analysis) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/ai-analysis/${analysis.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      notifications.show({
        title: '删除成功',
        message: '分析已删除',
        color: 'green',
      });
      setAnalysis(null);
    } catch (error) {
      notifications.show({
        title: '删除失败',
        message: '请稍后重试',
        color: 'red',
      });
    }
  };

  // 正在生成当前周的分析
  if (isCurrentWeekGenerating) {
    const displayContent = localStreamContent || streamContent;
    return (
      <Paper p="md" withBorder radius="md">
        <Stack gap="md">
          <Group gap="sm">
            <Loader size="sm" color="violet" />
            <Text size="lg" fw={500}>AI 智能分析中...</Text>
          </Group>
          {displayContent && (
            <ScrollArea.Autosize mah={500}>
              <Box
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  fontSize: '14px',
                  opacity: 0.8,
                }}
              >
                {displayContent}
              </Box>
            </ScrollArea.Autosize>
          )}
        </Stack>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper p="md" withBorder radius="md">
        <Text c="dimmed" ta="center">加载中...</Text>
      </Paper>
    );
  }

  if (!analysis) {
    if (!isAdmin) {
      return null;
    }

    // 如果正在生成其他周的分析
    if (generatingStatus?.isGenerating) {
      return (
        <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
          <Stack gap="md" align="center">
            <Loader size="sm" color="violet" />
            <Text size="lg" fw={500} c="dimmed">
              正在生成其他周的分析，请稍后再试
            </Text>
          </Stack>
        </Paper>
      );
    }

    return (
      <>
        <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
          <Stack gap="md" align="center">
            <IconSparkles size={32} color="var(--mantine-color-violet-6)" />
            <Text size="lg" fw={500} c="dimmed">暂无 AI 分析</Text>
            <Text size="sm" c="dimmed">点击下方按钮生成智能分析报告</Text>
            <Button
              leftSection={<IconSparkles size={18} />}
              onClick={() => setModalOpened(true)}
              variant="light"
              color="violet"
              disabled={generatingStatus?.isGenerating}
            >
              生成 AI 分析
            </Button>
          </Stack>
        </Paper>
        <AIAnalysisModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onGenerate={generateWithSSE}
        />
      </>
    );
  }

  return (
    <>
      <Paper p="md" withBorder radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <IconSparkles size={20} color="var(--mantine-color-violet-6)" />
              <Text size="lg" fw={500}>AI 智能分析</Text>
              {analysis.modelName && (
                <Badge size="sm" variant="light" color="gray">{analysis.modelName}</Badge>
              )}
            </Group>
            {isAdmin && (
              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  onClick={() => setModalOpened(true)}
                  title="重新生成"
                  disabled={generatingStatus?.isGenerating}
                >
                  <IconRefresh size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={handleDelete}
                  title="删除"
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            )}
          </Group>

          {analysis.userPrompt && (
            <Alert variant="light" color="gray" title="自定义提示词">
              <Text size="sm">{analysis.userPrompt}</Text>
            </Alert>
          )}

          <ScrollArea.Autosize mah={500}>
            <Box
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                fontSize: '14px',
              }}
            >
              {formatMarkdown(analysis.analysisContent)}
            </Box>
          </ScrollArea.Autosize>

          {analysis.metadata && (
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                生成时间: {new Date(analysis.createdAt).toLocaleString('zh-CN')}
              </Text>
              {analysis.metadata.tokenCount && (
                <Text size="xs" c="dimmed">
                  | Token: {analysis.metadata.tokenCount}
                </Text>
              )}
              {analysis.metadata.generationTime && (
                <Text size="xs" c="dimmed">
                  | 耗时: {analysis.metadata.generationTime.toFixed(1)}s
                </Text>
              )}
            </Group>
          )}
        </Stack>
      </Paper>

      <AIAnalysisModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onGenerate={generateWithSSE}
      />
    </>
  );
}

// 简单的 Markdown 格式化
function formatMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={index} fw={600} size="md" mt="md" mb="xs">
          {line.replace('### ', '')}
        </Text>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <Text key={index} fw={700} size="lg" mt="lg" mb="sm">
          {line.replace('## ', '')}
        </Text>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <Text key={index} fw={700} size="xl" mt="md" mb="sm">
          {line.replace('# ', '')}
        </Text>
      );
    } else if (line.startsWith('- **') && line.endsWith('**')) {
      const content = line.replace('- **', '').replace(/\*\*$/, '');
      elements.push(
        <Text key={index} component="div" size="sm" ml="sm">
          {content}
        </Text>
      );
    } else if (line.startsWith('- ')) {
      const content = line.replace('- ', '');
      elements.push(
        <Text key={index} component="div" size="sm" ml="sm">
          {formatInlineMarkdown(content)}
        </Text>
      );
    } else if (line.trim() === '') {
      elements.push(<Box key={index} h={8} />);
    } else {
      elements.push(
        <Text key={index} size="sm">
          {formatInlineMarkdown(line)}
        </Text>
      );
    }
  });

  return <>{elements}</>;
}

function formatInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}