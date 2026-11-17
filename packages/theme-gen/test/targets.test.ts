// Выходы генератора: снапшоты, синтаксис, проверка самой программой, актуальность файлов в репо.

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "node:fs/promises";
import { loadTheme, REPO_ROOT } from "../src/theme";
import { TARGETS } from "../src/targets";
import { ghostty } from "../src/targets/ghostty";
import { waybar } from "../src/targets/waybar";

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
