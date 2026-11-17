// Выходы генератора: снапшоты, синтаксис, проверка самой программой, актуальность файлов в репо.

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "node:fs/promises";
import { loadTheme, REPO_ROOT } from "../src/theme";
import { TARGETS } from "../src/targets";
import { ghostty } from "../src/targets/ghostty";
import { gtkName, waybar } from "../src/targets/waybar";
import { COMPONENTS, zellij } from "../src/targets/zellij";
import { base16, SLOTS } from "../src/targets/base16";
import { delta } from "../src/targets/delta";
import { FONT_FAMILY, vhs } from "../src/targets/vhs";

const t = await loadTheme();

describe("ghostty", () => {
  const out = ghostty(t);

  test("snapshot", () => expect(out).toMatchSnapshot());

  test("16 palette entries, all hex", () => {
    const entries = out.split("\n").filter((l) => l.startsWith("palette = "));
    expect(entries.map((l) => Number(l.match(/= (\d+)=/)![1]))).toEqual([...Array(16).keys()]);
    for (const l of entries) expect(l).toMatch(/^palette = \d+=#[0-9a-f]{6}$/);
  });

  // ghostty сам проверяет конфиг; без ghostty на машине тест пропускается
  test.skipIf(!Bun.which("ghostty"))("ghostty +validate-config accepts it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-ghostty-"));
    try {
      const file = join(dir, "uiu.conf");
      await Bun.write(file, out);
      const p = Bun.spawnSync(["ghostty", "+validate-config", `--config-file=${file}`]);
      expect({ code: p.exitCode, err: p.stdout.toString() + p.stderr.toString() }).toEqual({
        code: 0,
        err: "",
      });
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});

describe("waybar", () => {
  const out = waybar(t);

  test("snapshot", () => expect(out).toMatchSnapshot());

  // GTK (python3-gobject) сам разбирает файл; без него на машине тест пропускается
  const hasGtk =
    Bun.spawnSync(["python3", "-c", "import gi; gi.require_version('Gtk','3.0')"]).exitCode === 0;
  test.skipIf(!hasGtk)("GTK 3 parses it and every color is usable", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-waybar-"));
    try {
      await Bun.write(join(dir, "colors.css"), out);
      const uses = [...t.roles.keys()]
        .map((n) => `.r-${n.slice(2)} { color: @${gtkName(n)}; }`)
        .join("\n");
      await Bun.write(join(dir, "style.css"), `@import url("colors.css");\n${uses}\n`);
      const p = Bun.spawnSync(["python3", join(import.meta.dir, "gtk-validate.py"), join(dir, "style.css")]);
      expect({ code: p.exitCode, out: p.stdout.toString() }).toEqual({ code: 0, out: "" });
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test("one @define-color per role, valid GTK syntax", () => {
    const defs = out.split("\n").filter((l) => l.startsWith("@define-color"));
    expect(defs.length).toBe(t.roles.size);
    for (const l of defs) expect(l).toMatch(/^@define-color uiu_[a-z0-9_]+ #[0-9a-f]{6};$/);
  });
});

// файлы в themes/ коммитятся — они должны соответствовать текущим theme/*.css
describe("committed outputs are up to date", () => {
  for (const [rel, render] of Object.entries(TARGETS)) {
    test(rel, async () => {
      const file = Bun.file(join(REPO_ROOT, rel));
      expect(await file.exists()).toBe(true);
      expect(await file.text()).toBe(render(t));
    });
  }
});

describe("zellij", () => {
  const out = zellij(t);

  test("snapshot", () => expect(out).toMatchSnapshot());

  // компоненты встроенных тем zellij 0.46 (pencil-light и др.; frame_unselected — у части тем).
  // zellij не ругается на опечатки в именах, поэтому сверяем сами
  test("components match zellij 0.42+ theme spec", () => {
    expect(Object.keys(COMPONENTS).sort()).toEqual(
      [
        "text_unselected", "text_selected", "ribbon_selected", "ribbon_unselected", "ribbon_hover",
        "table_title", "table_cell_selected", "table_cell_unselected", "list_selected", "list_unselected",
        "frame_selected", "frame_unselected", "frame_highlight", "exit_code_success", "exit_code_error",
      ].sort(),
    );
  });

  test("every color is an «r g b» triple", () => {
    const colors = out.split("\n").filter((l) => /^\s+(base|background|emphasis_\d|player_\d+|(bright_)?[a-z]+) \d/.test(l));
    expect(colors.length).toBe(15 * 6 + 10 + 16);
    for (const l of colors) expect(l).toMatch(/^\s+\w+ \d{1,3} \d{1,3} \d{1,3}$/);
  });

  // zellij setup --check разбирает KDL файлов из theme_dir (имена ключей не проверяет)
  test.skipIf(!Bun.which("zellij"))("zellij setup --check parses it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-zellij-"));
    try {
      await Bun.write(join(dir, "themes/uiu.kdl"), out);
      await Bun.write(join(dir, "config.kdl"), `theme "uiu"\ntheme_dir "${join(dir, "themes")}"\n`);
      const p = Bun.spawnSync(["zellij", "--config-dir", dir, "--config", join(dir, "config.kdl"), "setup", "--check"]);
      const text = p.stdout.toString() + p.stderr.toString();
      expect(text).toContain("[CONFIG FILE]: Well defined.");
      expect(text).not.toMatch(/error/i);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});

describe("base16", () => {
  const out = base16(t);

  test("snapshot", () => expect(out).toMatchSnapshot());

  test("tinted-theming scheme: 16 slots base00…base0F, all hex", () => {
    const parsed = Bun.YAML.parse(out) as { system: string; variant: string; palette: Record<string, string> };
    expect(parsed.system).toBe("base16");
    expect(parsed.variant).toBe("light");
    expect(Object.keys(parsed.palette)).toEqual([...Array(16).keys()].map((i) => `base0${i.toString(16).toUpperCase()}`));
    for (const v of Object.values(parsed.palette)) expect(v).toMatch(/^#[0-9a-f]{6}$/);
  });

  // светлая схема: base00 → base07 темнеют монотонно
  test("gray ramp darkens from base00 to base07", () => {
    const ls = SLOTS.slice(0, 8).map(([, role]) => t.role(role).l);
    for (let i = 1; i < ls.length; i++) expect(ls[i]!).toBeLessThanOrEqual(ls[i - 1]!);
  });
});

describe("delta", () => {
  const out = delta(t);

  test("snapshot", () => expect(out).toMatchSnapshot());

  // git сам разбирает файл: значения с # должны быть в кавычках, иначе это комментарий
  test("git config reads every color", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-delta-"));
    try {
      await Bun.write(join(dir, "uiu.gitconfig"), out);
      const p = Bun.spawnSync(["git", "config", "--file", join(dir, "uiu.gitconfig"), "--get", "delta.minus-style"]);
      expect(p.stdout.toString().trim()).toBe(`syntax ${t.role("state-removed-bg").hex}`);
      const all = Bun.spawnSync(["git", "config", "--file", join(dir, "uiu.gitconfig"), "--list"]).stdout.toString();
      const hexes = all.match(/#[0-9a-f]{6}/g) ?? [];
      expect(hexes.length).toBe((out.match(/#[0-9a-f]{6}/g) ?? []).length);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test.skipIf(!Bun.which("delta"))("delta accepts the config", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-delta-"));
    try {
      await Bun.write(join(dir, "uiu.gitconfig"), out);
      await Bun.write(join(dir, "gitconfig"), `[include]\n\tpath = ${join(dir, "uiu.gitconfig")}\n`);
      const p = Bun.spawnSync(["delta", "--show-config"], { env: { ...process.env, GIT_CONFIG_GLOBAL: join(dir, "gitconfig") } });
      expect({ code: p.exitCode, err: p.stderr.toString() }).toEqual({ code: 0, err: "" });
      expect(p.stdout.toString()).toContain(t.role("state-removed-bg").hex);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});

describe("vhs", () => {
  const out = vhs(t);

  test("snapshot", () => expect(out).toMatchSnapshot());

  test("Set Theme with background, foreground and 16 ANSI colors", () => {
    const line = out.split("\n").find((l) => l.startsWith("Set Theme "))!;
    const theme = JSON.parse(line.slice("Set Theme ".length));
    expect(theme.background).toBe(t.role("surface-base").hex);
    const ansi = Object.keys(theme).filter((k) => !["name", "background", "foreground", "cursor", "selection"].includes(k));
    expect(ansi.length).toBe(16);
  });

  test("font family is the one fontconfig knows", () => {
    expect(out).toContain(`Set FontFamily '"${FONT_FAMILY}"'`);
  });

  // vhs validate разбирает сценарий, не запуская запись
  test.skipIf(!Bun.which("vhs"))("vhs validate accepts a tape that sources it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-vhs-"));
    try {
      await Bun.write(join(dir, "uiu.tape"), out);
      await Bun.write(join(dir, "demo.tape"), `Output demo.gif\nSource "${join(dir, "uiu.tape")}"\nType "ls"\n`);
      const p = Bun.spawnSync(["vhs", "validate", join(dir, "demo.tape")], { cwd: dir });
      expect({ code: p.exitCode, out: p.stdout.toString() + p.stderr.toString() }).toEqual({ code: 0, out: "" });
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
