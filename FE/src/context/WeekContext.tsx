import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

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
  const [searchParams, setSearchParams] = useSearchParams();

  // 从 URL 参数读取初始值，如果没有则使用当前年周
  const urlYear = searchParams.get('year');
  const urlWeek = searchParams.get('week');

  const defaultYear = new Date().getFullYear();
  const defaultWeek = getCurrentWeekNumber();

  const initialYear = urlYear ? parseInt(urlYear, 10) : defaultYear;
  const initialWeek = urlWeek ? parseInt(urlWeek, 10) : defaultWeek;

  const [year, setYearState] = useState(initialYear);
  const [weekNumber, setWeekNumberState] = useState(initialWeek);

  // 初始化时如果 URL 没有参数，自动添加
  useEffect(() => {
    if (!urlYear || !urlWeek) {
      const params = new URLSearchParams(searchParams);
      params.set('year', String(initialYear));
      params.set('week', String(initialWeek));
      setSearchParams(params, { replace: true });
    }
  }, []);

  // 更新 URL 参数
  const updateUrlParams = (newYear: number, newWeek: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('year', String(newYear));
    params.set('week', String(newWeek));
    setSearchParams(params, { replace: true });
  };

  const setYear = (newYear: number) => {
    setYearState(newYear);
    updateUrlParams(newYear, weekNumber);
  };

  const setWeekNumber = (newWeek: number) => {
    setWeekNumberState(newWeek);
    updateUrlParams(year, newWeek);
  };

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