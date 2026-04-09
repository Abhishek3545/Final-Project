export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "rrx_theme_mode";

const canUseDom = () => typeof window !== "undefined" && typeof document !== "undefined";

const resolveSystemTheme = (): "light" | "dark" => {
  if (!canUseDom()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyResolvedTheme = (resolvedTheme: "light" | "dark") => {
  if (!canUseDom()) return;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
};

export const getStoredThemeMode = (): ThemeMode => {
  if (!canUseDom()) return "system";

  const value = localStorage.getItem(THEME_STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
};

export const setStoredThemeMode = (mode: ThemeMode) => {
  if (!canUseDom()) return;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
};

export const applyThemeMode = (mode: ThemeMode): "light" | "dark" => {
  const resolved = mode === "system" ? resolveSystemTheme() : mode;
  applyResolvedTheme(resolved);
  return resolved;
};

export const initializeTheme = () => {
  const mode = getStoredThemeMode();
  applyThemeMode(mode);
};
