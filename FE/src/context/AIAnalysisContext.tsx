import { createContext, useContext, useState, ReactNode } from 'react';

interface GeneratingStatus {
  isGenerating: boolean;
  year: number | null;
  weekNumber: number | null;
  partialContent: string;
}

interface AIAnalysisState {
  // 当前正在显示的流式内容（本地组件用）
  localStreamContent: string;
  setLocalStreamContent: (content: string) => void;
  appendLocalStreamContent: (chunk: string) => void;
}

const AIAnalysisContext = createContext<AIAnalysisState | null>(null);

export function AIAnalysisProvider({ children }: { children: ReactNode }) {
  const [localStreamContent, setLocalStreamContent] = useState('');

  const appendLocalStreamContent = (chunk: string) => {
    setLocalStreamContent(prev => prev + chunk);
  };

  return (
    <AIAnalysisContext.Provider
      value={{
        localStreamContent,
        setLocalStreamContent,
        appendLocalStreamContent,
      }}
    >
      {children}
    </AIAnalysisContext.Provider>
  );
}

export function useAIAnalysisState() {
  const context = useContext(AIAnalysisContext);
  if (!context) {
    throw new Error('useAIAnalysisState must be used within an AIAnalysisProvider');
  }
  return context;
}