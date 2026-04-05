import { Container, Title, Text } from '@mantine/core';
import { TaskTable } from '../components/TaskTable/TaskTable';

export function HomePage() {
  return (
    <Container size="xl" py="xl" style={{ minWidth: 1800 }}>
      <Title order={1} mb="xs">任务管理系统</Title>
      <Text c="dimmed" mb="xl">管理和查看每周任务</Text>
      <TaskTable />
    </Container>
  );
}
