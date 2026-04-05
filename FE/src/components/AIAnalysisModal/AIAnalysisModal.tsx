import { useState } from 'react';
import {
  Modal, Stack, Textarea, Button, Text, Group, Switch, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { aiAnalysisApi } from '../../services/ai-analysis.api';

interface AIAnalysisModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  year: number;
  weekNumber: number;
  hasExistingAnalysis: boolean;
}

export function AIAnalysisModal({ opened, onClose, onSuccess, year, weekNumber, hasExistingAnalysis }: AIAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await aiAnalysisApi.generate({
        year,
        weekNumber,
        userPrompt: userPrompt.trim() || undefined,
        forceRegenerate: forceRegenerate || hasExistingAnalysis ? 'true' : undefined,
      });

      notifications.show({
        title: '生成成功',
        message: 'AI 分析已完成',
        color: 'green',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: '生成失败',
        message: error.response?.data?.message || '请检查 AI 配置或稍后重试',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="AI 智能分析" size="lg">
      <Stack gap="md">
        <Alert variant="light" color="blue" title="提示">
          AI 将根据当前周报的统计数据生成人力分析报告，您可以添加自定义提示词让分析更精准。
        </Alert>

        <Textarea
          label="自定义提示词（可选）"
          placeholder="例如：重点关注人员工作量偏差，分析项目进度风险..."
          minRows={4}
          maxRows={8}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.currentTarget.value)}
          description="输入特定要求，让分析更符合您的需求"
        />

        {hasExistingAnalysis && (
          <Switch
            label="覆盖已有分析"
            description="本周已有分析报告，勾选此项将重新生成并覆盖"
            checked={forceRegenerate}
            onChange={(event) => setForceRegenerate(event.currentTarget.checked)}
          />
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>取消</Button>
          <Button onClick={handleGenerate} loading={loading}>
            开始分析
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}