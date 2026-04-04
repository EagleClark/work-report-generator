export interface WorkReport {
  id: number;
  title: string;
  content: string;
  weekNumber: number;
  year: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkReportDto {
  title: string;
  content: string;
  weekNumber: number;
  year: number;
  userId?: string;
}

export interface UpdateWorkReportDto {
  title?: string;
  content?: string;
  weekNumber?: number;
  year?: number;
  userId?: string;
}

export interface QueryWorkReportDto {
  year?: number;
  weekNumber?: number;
}
