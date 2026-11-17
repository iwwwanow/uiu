// Загрузка темы: palette.css (примитивы) + roles.css (роли) → hex для каждой роли.

import { join } from "node:path";
import { parseVars, resolveVar } from "./css";
import { parseColor, rgbToOklch, toHex, type RGB } from "./color";

export type Color = { hex: string; rgb: RGB; l: number };

export type Theme = {
  /** примитивы из palette.css */
  palette: Map<string, string>;
  /** роли из roles.css (сырые значения, var(--…)) */
  roles: Map<string, string>;
  /** все переменные вместе — для разрешения var() */
  vars: Map<string, string>;
  /** цвет роли по имени без `--`: role("surface-base"). Неизвестная роль — ошибка. */
  role: (name: string) => Color;
};

export const REPO_ROOT = join(import.meta.dir, "../../..");
export const THEME_DIR = join(REPO_ROOT, "theme");

export function color(value: string): Color {
  const rgb = parseColor(value);
  return { hex: toHex(rgb), rgb, l: rgbToOklch(rgb).l };
}

export function buildTheme(paletteCss: string, rolesCss: string): Theme {
  const palette = parseVars(paletteCss, "palette.css");
  const roles = parseVars(rolesCss, "roles.css");
  const vars = new Map([...palette, ...roles]);
  for (const name of roles.keys()) {
    if (palette.has(name)) throw new Error(`${name} is both a primitive and a role`);
  }
  const cache = new Map<string, Color>();
  const role = (name: string) => {
    const key = `--${name}`;
    if (!roles.has(key)) throw new Error(`unknown role ${key}`);
    let c = cache.get(key);
    if (!c) cache.set(key, (c = color(resolveVar(vars, key))));
    return c;
  };
  return { palette, roles, vars, role };
}

export async function loadTheme(dir = THEME_DIR): Promise<Theme> {
  const [p, r] = await Promise.all([
    Bun.file(join(dir, "palette.css")).text(),
    Bun.file(join(dir, "roles.css")).text(),
  ]);
  return buildTheme(p, r);
}
