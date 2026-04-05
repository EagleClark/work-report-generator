import { useEffect, useState } from 'react';
import {
  Paper, Text, Stack, Group, Badge, Button, ScrollArea, ActionIcon, Alert, Box
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconTrash, IconSparkles } from '@tabler/icons-react';
import { aiAnalysisApi } from '../../services/ai-analysis.api';
import type { AIAnalysis } from '../../types/ai-analysis';
import { AIAnalysisModal } from '../AIAnalysisModal/AIAnalysisModal';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

interface AIAnalysisDisplayProps {
  year: number;
  weekNumber: number;
}

export function AIAnalysisDisplay({ year, weekNumber }: AIAnalysisDisplayProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const { user, hasRole } = useAuth();

  // 是否为管理员（可触发生成和删除）
  const isAdmin = hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const data = await aiAnalysisApi.getCurrent(year, weekNumber);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!analysis) return;

    try {
      await aiAnalysisApi.delete(analysis.id);
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

  useEffect(() => {
    fetchAnalysis();
  }, [year, weekNumber]);

  if (loading) {
    return (
      <Paper p="md" withBorder radius="md">
        <Text c="dimmed" ta="center">加载中...</Text>
      </Paper>
    );
  }

  if (!analysis) {
    // 无分析时，只有管理员显示生成按钮
    if (!isAdmin) {
      return null;
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
            >
              生成 AI 分析
            </Button>
          </Stack>
        </Paper>
        <AIAnalysisModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onSuccess={fetchAnalysis}
          year={year}
          weekNumber={weekNumber}
          hasExistingAnalysis={false}
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
        onSuccess={fetchAnalysis}
        year={year}
        weekNumber={weekNumber}
        hasExistingAnalysis={true}
      />
    </>
  );
}

// 简单的 Markdown 格式化
function formatMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    // 标题
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
      // 加粗列表项
      const content = line.replace('- **', '').replace(/\*\*$/, '');
      elements.push(
        <Text key={index} component="div" size="sm" ml="sm">
              {content}
        </Text>
      );
    } else if (line.startsWith('- ')) {
      // 普通列表项
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

// 处理行内 Markdown
function formatInlineMarkdown(text: string): React.ReactNode {
  // 简单处理加粗
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}