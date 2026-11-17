// Выходы генератора: снапшоты, синтаксис, проверка самой программой, актуальность файлов в репо.

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "node:fs/promises";
import { loadTheme, REPO_ROOT } from "../src/theme";
import { TARGETS } from "../src/targets";
import { ghostty } from "../src/targets/ghostty";
import { gtkName, waybar } from "../src/targets/waybar";

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
