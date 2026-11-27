import { safeStorage } from './safeStorage';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'typecrest_theme';

export function getInitialTheme(): ThemeMode {
  const saved = safeStorage.getItem(THEME_STORAGE_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

export function saveTheme(theme: ThemeMode): void {
  safeStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}
