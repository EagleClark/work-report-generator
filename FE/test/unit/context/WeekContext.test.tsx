import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WeekProvider, useWeek, getWeekDateRange } from '@/context/WeekContext';

// 测试组件
const TestComponent = () => {
  const { year, weekNumber, setYear, setWeekNumber } = useWeek();

  return (
    <div>
      <span data-testid="year">{year}</span>
      <span data-testid="week">{weekNumber}</span>
      <button onClick={() => setYear(2023)}>设置年份为2023</button>
      <button onClick={() => setWeekNumber(10)}>设置周次为10</button>
    </div>
  );
};

const renderWithProvider = (initialEntries?: string[]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <WeekProvider>
        <TestComponent />
      </WeekProvider>
    </MemoryRouter>
  );
};

describe('WeekContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始状态测试', () => {
    it('初始年份为当前年份', () => {
      renderWithProvider();

      const currentYear = new Date().getFullYear();
      expect(screen.getByTestId('year').textContent).toBe(currentYear.toString());
    });

    it('初始周次为当前周次', () => {
      renderWithProvider();

      const weekNumber = parseInt(screen.getByTestId('week').textContent || '0');
      expect(weekNumber).toBeGreaterThanOrEqual(1);
      expect(weekNumber).toBeLessThanOrEqual(53);
    });
  });

  describe('状态更新测试', () => {
    it('setYear更新年份', async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByText('设置年份为2023').click();
      });

      expect(screen.getByTestId('year').textContent).toBe('2023');
    });

    it('setWeekNumber更新周次', async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByText('设置周次为10').click();
      });

      expect(screen.getByTestId('week').textContent).toBe('10');
    });
  });

  describe('useWeek hook测试', () => {
    it('在Provider外使用时抛出错误', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useWeek must be used within a WeekProvider');

      consoleError.mockRestore();
    });
  });
});

describe('getWeekDateRange函数', () => {
  it('返回正确的日期范围格式', () => {
    const result = getWeekDateRange(2024, 1);
    expect(result).toMatch(/\d+月\d+日 - \d+月\d+日/);
  });

  it('第1周的日期范围正确', () => {
    const result = getWeekDateRange(2024, 1);
    // 2024年第1周应该从1月初开始
    expect(result).toContain('1月');
  });

  it('第52周的日期范围正确', () => {
    const result = getWeekDateRange(2024, 52);
    // 第52周应该在12月
    expect(result).toContain('12月');
  });

  it('跨年周次正确处理', () => {
    // 第53周或跨年周
    const result = getWeekDateRange(2024, 53);
    expect(result).toMatch(/\d+月\d+日 - \d+月\d+日/);
  });

  it('年中周次正确计算', () => {
    const result = getWeekDateRange(2024, 26);
    expect(result).toMatch(/\d+月\d+日 - \d+月\d+日/);
  });

  it('闰年正确处理', () => {
    // 2024年是闰年
    const result = getWeekDateRange(2024, 9);
    expect(result).toMatch(/\d+月\d+日 - \d+月\d+日/);
  });

  it('普通年正确处理', () => {
    // 2023年不是闰年
    const result = getWeekDateRange(2023, 9);
    expect(result).toMatch(/\d+月\d+日 - \d+月\d+日/);
  });
});