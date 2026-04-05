import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WeekContextType {
  year: number;
  weekNumber: number;
  setYear: (year: number) => void;
  setWeekNumber: (week: number) => void;
}

const WeekContext = createContext<WeekContextType | null>(null);

// 获取当前周数（ISO周数）
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  // 计算ISO周数
  const jan4th = new Date(now.getFullYear(), 0, 4);
  const dayOfWeek = now.getDay() || 7; // 将周日从0改为7
  const jan4thDayOfWeek = jan4th.getDay() || 7;

  // 计算第一周的第一天（周一）
  const firstMonday = new Date(now.getFullYear(), 0, 4 - jan4thDayOfWeek + 1);

  const weekNumber = Math.floor((now.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return weekNumber > 0 ? weekNumber : 1;
}

// 获取周日期范围
export function getWeekDateRange(year: number, week: number): string {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const weekStart = simple;
  if (dow <= 4) {
    weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    weekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDate = (d: Date) => {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}月${day}日`;
  };

  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
}

export function WeekProvider({ children }: { children: ReactNode }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [weekNumber, setWeekNumber] = useState(getCurrentWeekNumber());

  return (
    <WeekContext.Provider value={{ year, weekNumber, setYear, setWeekNumber }}>
      {children}
    </WeekContext.Provider>
  );
}

export function useWeek() {
  const context = useContext(WeekContext);
  if (!context) {
    throw new Error('useWeek must be used within a WeekProvider');
  }
  return context;
}