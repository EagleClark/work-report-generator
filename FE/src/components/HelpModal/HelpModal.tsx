import {
  Modal, Text, Stack, Title, Table, Box, Button, Group, Badge
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface HelpModalProps {
  opened: boolean;
  onClose: () => void;
}

// 字段说明数据
const fieldDescriptions = [
  { field: '项目', description: '任务所属项目名称，新增时从已有项目中选择' },
  { field: 'US/DTS', description: '用户故事(US)或缺陷(DTS)编号，可填写链接' },
  { field: '任务详情', description: '任务的具体描述，最多200字' },
  { field: '进度', description: '任务完成百分比，0-100%' },
  { field: '预计', description: '预计总工作量（人天）' },
  { field: '实际', description: '已投入的总工作量（人天）' },
  { field: '本周计划', description: '计划本周投入的工作量，新增任务时必填' },
  { field: '本周实际', description: '本周实际投入的工作量' },
  { field: '计划时间', description: '计划开始和结束日期' },
  { field: '实际时间', description: '实际开始和结束日期（进度100%时必填）' },
  { field: '责任人', description: '任务负责人，普通用户和管理员默认为当前用户' },
  { field: '备注', description: '其他说明信息，最多500字' },
];

// 操作机制说明
const mechanismDescriptions = [
  {
    title: '复制上周任务',
    content: '复制上周未完成的任务（进度 < 100%）到本周。自动跳过已存在的相同任务（项目+任务详情+责任人相同）。复制时本周计划工作量和本周实际工作量均重置为0，其他字段继承原值。',
  },
  {
    title: '进度与时间校验',
    content: '进度不为0时，必须填写实际开始时间、实际工作量、本周工作量；进度达到100%时，还必须填写实际结束时间；进度未完成时，不应填写实际结束时间。',
  },
  {
    title: '工作量校验',
    content: '本周实际工作量不能大于实际工作量；预计工作量必须大于0。',
  },
  {
    title: '权限控制',
    content: '普通用户只能查看和操作自己的任务；管理员/超管可以查看和操作所有任务。',
  },
];

// AI分析说明
const aiAnalysisDescriptions = [
  {
    title: '功能介绍',
    content: 'AI智能分析功能基于本周任务数据，自动生成周报分析报告，包括任务完成情况、工作量分析、风险提示等。',
  },
  {
    title: '生成分析',
    content: '点击"生成AI分析"按钮，可选择填写自定义提示词来引导分析方向。AI将根据本周任务数据流式生成分析报告。',
  },
  {
    title: '重新生成',
    content: '点击刷新按钮可以重新生成分析报告，会覆盖之前的分析内容。生成过程中无法重复生成。',
  },
  {
    title: '权限说明',
    content: '所有用户都可以查看AI分析报告；仅管理员和超管可以生成、重新生成和删除分析报告。',
  },
  {
    title: '自定义提示词',
    content: '可选填写的提示词，用于引导AI关注特定方面。例如："重点关注延期任务的风险分析"或"分析各项目的工作量分布情况"。',
  },
];

export function HelpModal({ opened, onClose }: HelpModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>使用帮助</Title>}
      size="xl"
      centered
    >
      <Stack gap="md">
        {/* AI分析说明 */}
        <Box>
          <Group gap="xs" mb="sm">
            <Title order={5}>AI智能分析</Title>
            <Badge size="sm" color="violet" variant="light">亮点功能</Badge>
          </Group>
          <Stack gap="sm">
            {aiAnalysisDescriptions.map((item) => (
              <Box key={item.title}>
                <Text fw={500} size="sm">{item.title}</Text>
                <Text size="sm" c="dimmed">{item.content}</Text>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* 字段说明 */}
        <Box>
          <Title order={5} mb="sm">表格字段说明</Title>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 100 }}>字段</Table.Th>
                <Table.Th>说明</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {fieldDescriptions.map((item) => (
                <Table.Tr key={item.field}>
                  <Table.Td fw={500}>{item.field}</Table.Td>
                  <Table.Td>{item.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>

        {/* 操作机制说明 */}
        <Box>
          <Title order={5} mb="sm">操作机制说明</Title>
          <Stack gap="sm">
            {mechanismDescriptions.map((item) => (
              <Box key={item.title}>
                <Text fw={500} size="sm">{item.title}</Text>
                <Text size="sm" c="dimmed">{item.content}</Text>
              </Box>
            ))}
          </Stack>
        </Box>

        <Group justify="flex-end" mt="md">
          <Button onClick={onClose}>我知道了</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// 带按钮的帮助组件
export function HelpButton() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button variant="subtle" size="compact-sm" onClick={open}>
        ❓ 帮助
      </Button>
      <HelpModal opened={opened} onClose={close} />
    </>
  );
}