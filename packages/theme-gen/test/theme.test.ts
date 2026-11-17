// Инварианты темы: проверяются на настоящих theme/palette.css и theme/roles.css.

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { parseVars, refChain, resolveVar } from "../src/css";
import { contrast, inGamut, parseColor, rgbToOklch } from "../src/color";
import { loadTheme, REPO_ROOT, THEME_DIR } from "../src/theme";

const t = await loadTheme();
const roleNames = [...t.roles.keys()].map((n) => n.slice(2));
const owo = parseVars(await Bun.file(join(REPO_ROOT, "owo.css")).text(), "owo.css", {
  firstWins: true,
});
const rolesSrc = await Bun.file(join(THEME_DIR, "roles.css")).text();

describe("palette", () => {
  test("every primitive is a valid color inside sRGB", () => {
    for (const [name, value] of t.palette) {
      const rgb = parseColor(value);
      expect({ name, inGamut: inGamut(rgb) }).toEqual({ name, inGamut: true });
    }
  });

  test("step name = OKLCH L × 100", () => {
    for (const [name, value] of t.palette) {
      const m = name.match(/-(\d+)$/);
      if (!m) continue; // базовые акценты owo: --RED, --BLUE …
      const l = rgbToOklch(parseColor(value)).l;
      expect({ name, step: Math.round(l * 100) }).toEqual({ name, step: Number(m[1]) });
    }
  });

  // пока owo.css генерируется из owo, ступени дублируют его токены — они обязаны совпадать
  test("steps that mirror owo tokens equal them", () => {
    const pairs = {
      "--GRAY-100": "--WHITE",
      "--GRAY-91": "--LIGHT",
      "--GRAY-72": "--MEDIUM",
      "--GRAY-44": "--DARK",
      "--GRAY-0": "--BLACK",
      "--RED": "--RED",
      "--GREEN": "--GREEN",
      "--BLUE": "--BLUE",
      "--BLUE-DARK": "--BLUE-DARK",
      "--ORANGE": "--ORANGE",
    };
    for (const [step, token] of Object.entries(pairs)) {
      const a = parseColor(t.palette.get(step)!);
      const b = parseColor(owo.get(token)!);
      expect({ step, hex: a.map((x) => Math.round(x * 255)) }).toEqual({
        step,
        hex: b.map((x) => Math.round(x * 255)),
      });
    }
  });
});

describe("roles", () => {
  test("every role resolves to a palette step", () => {
    for (const name of roleNames) {
      const chain = refChain(t.vars, `--${name}`);
      expect(t.palette.has(chain.at(-1)!)).toBe(true);
      expect(() => resolveVar(t.vars, `--${name}`)).not.toThrow();
    }
  });

  test("roles.css has no literal colors", () => {
    const clean = rolesSrc.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(clean).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(|rgb\(/i);
  });

  test("text is readable on every surface (WCAG ≥ 7)", () => {
    for (const s of ["sunken", "base", "chrome", "overlay", "modal"]) {
      const c = contrast(t.role("text").rgb, t.role(`surface-${s}`).rgb);
      expect({ s, ok: c >= 7 }).toEqual({ s, ok: true });
    }
  });

  test("state colors are readable on base (WCAG ≥ 4.5)", () => {
    for (const s of ["added", "changed", "removed", "error", "warning", "info"]) {
      const c = contrast(t.role(`state-${s}`).rgb, t.role("surface-base").rgb);
      expect({ s, ok: c >= 4.5 }).toEqual({ s, ok: true });
    }
  });

  // уровни поверхностей должны различаться глазом: ΔL ≥ 0.015
  test("surface levels are distinguishable from base", () => {
    const base = t.role("surface-base").l;
    for (const s of ["sunken", "chrome", "overlay"]) {
      const d = Math.abs(t.role(`surface-${s}`).l - base);
      expect({ s, ok: d >= 0.015 }).toEqual({ s, ok: true });
    }
  });

  test("hover differs from its surface", () => {
    for (const s of ["sunken", "base", "chrome", "overlay"]) {
      expect(t.role(`surface-${s}-hover`).hex).not.toBe(t.role(`surface-${s}`).hex);
    }
  });

  test("ANSI 16 is complete", () => {
    for (const n of ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"]) {
      expect(roleNames).toContain(`ansi-${n}`);
      expect(roleNames).toContain(`ansi-bright-${n}`);
    }
  });

  test("unknown role is an error", () => expect(() => t.role("surface-nope")).toThrow());
});
