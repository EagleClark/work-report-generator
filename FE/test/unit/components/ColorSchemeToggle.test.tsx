import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';

const mockSetColorScheme = vi.fn();

vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual<typeof import('@mantine/core')>('@mantine/core');
  return {
    ...actual,
    useMantineColorScheme: () => ({
      setColorScheme: mockSetColorScheme,
    }),
  };
});

describe('ColorSchemeToggle 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染三个主题切换按钮', () => {
    render(<ColorSchemeToggle />);

    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto' })).toBeInTheDocument();
  });

  it('点击 Light 按钮切换为亮色主题', async () => {
    const user = userEvent.setup();
    render(<ColorSchemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Light' }));

    expect(mockSetColorScheme).toHaveBeenCalledWith('light');
  });

  it('点击 Dark 按钮切换为暗色主题', async () => {
    const user = userEvent.setup();
    render(<ColorSchemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(mockSetColorScheme).toHaveBeenCalledWith('dark');
  });

  it('点击 Auto 按钮切换为自动主题', async () => {
    const user = userEvent.setup();
    render(<ColorSchemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Auto' }));

    expect(mockSetColorScheme).toHaveBeenCalledWith('auto');
  });
});
