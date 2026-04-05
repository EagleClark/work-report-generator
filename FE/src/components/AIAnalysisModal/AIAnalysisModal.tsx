import { useState } from 'react';
import {
  Modal, Stack, Textarea, Button, Text, Group, Alert
} from '@mantine/core';

interface AIAnalysisModalProps {
  opened: boolean;
  onClose: () => void;
  onGenerate: (userPrompt?: string) => void;
}

export function AIAnalysisModal({ opened, onClose, onGenerate }: AIAnalysisModalProps) {
  const [userPrompt, setUserPrompt] = useState('');

  const handleGenerate = () => {
    onGenerate(userPrompt.trim() || undefined);
    setUserPrompt('');
    onClose();
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

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>取消</Button>
          <Button onClick={handleGenerate}>
            开始分析
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}