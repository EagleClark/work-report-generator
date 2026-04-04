import { useState, useEffect } from 'react';
import { Table, Group, Button, NumberInput, Modal, Badge, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { workReportApi } from '../../services/work-report.api';
import type { WorkReport, CreateWorkReportDto } from '../../types/work-report';
import { WorkReportForm } from '../WorkReportForm/WorkReportForm';

interface WorkReportTableProps {
  refreshTrigger?: number;
  onDataChange?: (count: number) => void;
}

export function WorkReportTable({ refreshTrigger, onDataChange }: WorkReportTableProps) {
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [editingReport, setEditingReport] = useState<WorkReport | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const query: Record<string, number> = { year };
      if (weekNumber) {
        query.weekNumber = Number(weekNumber);
      }
      const data = await workReportApi.getAll(query);
      setReports(data);
      onDataChange?.(data.length);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const handleSearch = () => {
    fetchReports();
  };

  const handleCreate = async (dto: CreateWorkReportDto) => {
    await workReportApi.create(dto);
    closeModal();
    fetchReports();
  };

  const handleUpdate = async (dto: CreateWorkReportDto) => {
    if (!editingReport) {
      return;
    }
    await workReportApi.update(editingReport.id, dto);
    setEditingReport(null);
    closeModal();
    fetchReports();
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await workReportApi.delete(deletingId);
      closeDeleteModal();
      setDeletingId(null);
      fetchReports();
    }
  };

  const openEditModal = (report: WorkReport) => {
    setEditingReport(report);
    openModal();
  };

  const openCreateModal = () => {
    setEditingReport(null);
    openModal();
  };

  return (
    <div>
      <Group mb="md" align="flex-end">
        <NumberInput
          label="年份"
          value={year}
          onChange={(val) => setYear(Number(val))}
          min={2000}
          max={2100}
          style={{ width: 120 }}
        />
        <NumberInput
          label="周数"
          placeholder="全部"
          value={weekNumber}
          onChange={(val) => setWeekNumber(val)}
          min={1}
          max={53}
          style={{ width: 120 }}
        />
        <Button onClick={handleSearch} loading={loading}>
          查询
        </Button>
        <Button onClick={openCreateModal}>
          新增周报
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>标题</Table.Th>
            <Table.Th>内容</Table.Th>
            <Table.Th>年份</Table.Th>
            <Table.Th>周数</Table.Th>
            <Table.Th>操作</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reports.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text c="dimmed" ta="center">暂无数据</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            reports.map((report) => (
              <Table.Tr key={report.id}>
                <Table.Td>{report.id}</Table.Td>
                <Table.Td>{report.title}</Table.Td>
                <Table.Td>
                  <Text lineClamp={2}>{report.content}</Text>
                </Table.Td>
                <Table.Td>{report.year}</Table.Td>
                <Table.Td>
                  <Badge>第{report.weekNumber}周</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="subtle" onClick={() => openEditModal(report)}>
                      编辑
                    </Button>
                    <Button size="xs" variant="subtle" color="red" onClick={() => handleDeleteClick(report.id)}>
                      删除
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingReport ? '编辑周报' : '新增周报'}
        size="lg"
      >
        <WorkReportForm
          onSubmit={editingReport ? handleUpdate : handleCreate}
          onCancel={closeModal}
          initialData={editingReport || undefined}
          isEdit={!!editingReport}
        />
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="确认删除"
      >
        <Text>确定要删除这条周报吗？</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>取消</Button>
          <Button color="red" onClick={handleDeleteConfirm}>确认删除</Button>
        </Group>
      </Modal>
    </div>
  );
}
