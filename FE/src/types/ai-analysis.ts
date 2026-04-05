export interface AIAnalysis {
  id: number;
  year: number;
  weekNumber: number;
  analysisContent: string;
  userPrompt?: string;
  modelType: string;
  modelName?: string;
  metadata?: {
    tokenCount?: number;
    generationTime?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalysisDto {
  year: number;
  weekNumber: number;
  userPrompt?: string;
  forceRegenerate?: string;
}

export interface QueryAnalysisDto {
  year?: number;
  weekNumber?: number;
}