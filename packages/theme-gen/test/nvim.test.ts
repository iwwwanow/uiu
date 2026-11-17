// Тема nvim: после всех ссылок каждая группа получает цвет из ролей uiu, тема грузится без ошибок.

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "node:fs/promises";
import { loadTheme, REPO_ROOT } from "../src/theme";
import { GROUPS, nvimInit, type Spec } from "../src/targets/nvim";

const t = await loadTheme();
const PKG = join(import.meta.dir, "..");
const SNAPSHOT_LUA = join(PKG, "scripts/nvim-hl-snapshot.lua");

type Def = Record<string, unknown>;
const builtin: { nvim: string; groups: Record<string, Def> } = await Bun.file(
  join(PKG, "data/nvim-builtin.json"),
).json();

// Группы плагинов, которым мало встроенных ссылок: свои hex или ссылка на NonText
// (MAGENTA — только конец строки). Остальные ~250 групп плагинов ссылаются на базовые
// (TelescopeNormal → Normal, OilDir → Directory) и подхватывают тему сами.
// Источник — снимок плагинов, см. scripts/nvim-hl-snapshot.lua (g:uiu_user).
// todo-comments здесь нет: TodoFg/Bg/Sign* он пересчитывает из Diagnostic* и Identifier
// по ColorScheme, тема их не задаёт. lualine_* строит lualine из lua/lualine/themes/uiu.lua.
const FOREIGN = { fg: "#bada55" };
const PLUGIN_GROUPS: Record<string, Def> = {
  // nvim-cmp: *Default ставит без default = true — перекрываем группу над ними
  CmpItemKind: { link: "CmpItemKindDefault" },
  CmpItemKindDefault: FOREIGN,
  CmpItemKindIcon: { link: "CmpItemKindIconDefault" },
  CmpItemKindIconDefault: FOREIGN,
  CmpItemAbbrDeprecated: { link: "CmpItemAbbrDeprecatedDefault" },
  CmpItemAbbrDeprecatedDefault: FOREIGN,
  CmpItemAbbrMatch: { link: "CmpItemAbbrMatchDefault" },
  CmpItemAbbrMatchDefault: {},
  // nvim-web-devicons: цвет задаёт конфиг пользователя
  DevIconDefault: FOREIGN,
  // gitsigns: Staged* — смесь цветов обычных знаков
  ...Object.fromEntries(
    ["Add", "Change", "Changedelete", "Delete", "Topdelete", "Untracked"].flatMap((k) =>
      ["", "Nr", "Cul"].map((p) => [`GitSignsStaged${k}${p}`, FOREIGN]),
    ),
  ),
  ...Object.fromEntries(
    ["Add", "Change", "Changedelete", "Untracked"].map((k) => [`GitSignsStaged${k}Ln`, FOREIGN]),
  ),
  GitSignsDiffStaged: FOREIGN,
  GitSignsAddLn: { link: "DiffAdd" },
  GitSignsChangeLn: { link: "DiffChange" },
  GitSignsChangedeleteLn: { link: "GitSignsChangeLn" },
  GitSignsUntrackedLn: { link: "GitSignsAddLn" },
  GitSignsCurrentLineBlame: { link: "NonText" },
  // telescope
  TelescopeNormal: { link: "Normal" },
  TelescopeBorder: { link: "TelescopeNormal" },
  TelescopeTitle: { link: "TelescopeBorder" },
  TelescopeSelection: { link: "Visual" },
  TelescopeMatching: { link: "Special" },
  TelescopePromptCounter: { link: "NonText" },
  TelescopePreviewHyphen: { link: "NonText" },
  TelescopeResultsDiffUntracked: { link: "NonText" },
};

/** Что видит nvim после :colorscheme uiu: тема поверх ссылок плагинов и встроенных. */
function lookup(name: string): Spec | Def | undefined {
  return GROUPS[name] ?? PLUGIN_GROUPS[name] ?? builtin.groups[name];
}

type Resolved = { name: string; theme: boolean; def: Def };

/** Пройти ссылки до группы с атрибутами. @a.b.c без определения берёт @a.b, потом @a. */
function resolve(name: string, seen: string[] = []): Resolved {
  if (seen.includes(name)) throw new Error(`link cycle: ${[...seen, name].join(" → ")}`);
  const def = lookup(name) as Def | undefined;
  if (def === undefined) {
    const parent = name.startsWith("@") ? name.replace(/\.[^.]+$/, "") : name;
    if (parent !== name) return resolve(parent, [...seen, name]);
    return { name, theme: false, def: {} };
  }
  if (typeof def.link === "string") return resolve(def.link, [...seen, name]);
  return { name, theme: name in GROUPS, def };
}

const COLOR_KEYS = ["fg", "bg", "sp"] as const;
// CmpItem*Default — запасные цели ссылок cmp, сами на экран не идут
const FALLBACK_ONLY = /^CmpItem\w+Default$/;
const ALL = [...new Set([...Object.keys(builtin.groups), ...Object.keys(PLUGIN_GROUPS), ...Object.keys(GROUPS)])];

describe("nvim groups", () => {
  test("every group ends in theme colors, not foreign hex", () => {
    const foreign = ALL.filter((n) => !FALLBACK_ONLY.test(n)).flatMap((name) => {
      const r = resolve(name);
      const colored = COLOR_KEYS.some((k) => k in r.def);
      return colored && !r.theme ? [`${name} → ${r.name} ${JSON.stringify(r.def)}`] : [];
    });
    expect(foreign).toEqual([]);
  });

  test("MAGENTA (marker-invisible) only at end of line: NonText", () => {
    const users = ALL.filter((name) => {
      const r = resolve(name);
      return r.theme && COLOR_KEYS.some((k) => r.def[k] === "marker-invisible");
    });
    expect(users).toEqual(["NonText"]);
  });

  test("links point to known groups", () => {
    const known = new Set(ALL);
    const bad = Object.entries(GROUPS).flatMap(([n, s]) =>
      "link" in s && !known.has(s.link) ? [`${n} → ${s.link}`] : [],
    );
    expect(bad).toEqual([]);
  });

  test("no bold anywhere", () => {
    expect(Object.entries(GROUPS).filter(([, s]) => "bold" in s)).toEqual([]);
  });

  test("snapshot", () => expect(nvimInit(t)).toMatchSnapshot());
});

const hasNvim = !!Bun.which("nvim");

describe.skipIf(!hasNvim)("nvim --headless", () => {
  test("colorscheme uiu loads without errors, all colors come from roles", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-nvim-"));
    try {
      const out = join(dir, "out.json");
      const lua = join(dir, "check.lua");
      await Bun.write(
        lua,
        `
        vim.opt.rtp:prepend(${JSON.stringify(REPO_ROOT)})
        vim.o.termguicolors = true
        local ok, err = pcall(vim.cmd.colorscheme, "uiu")
        local colors = {}
        for name in pairs(vim.api.nvim_get_hl(0, {})) do
          local d = vim.api.nvim_get_hl(0, { name = name, link = false })
          for _, k in ipairs({ "fg", "bg", "sp" }) do
            if d[k] then colors[string.format("#%06x", d[k])] = name end
          end
        end
        local lualine = require("lualine.themes.uiu")
        local f = io.open(${JSON.stringify(out)}, "w")
        f:write(vim.json.encode({
          ok = ok, err = err and tostring(err) or vim.v.errmsg,
          name = vim.g.colors_name, background = vim.o.background,
          colors = colors, term15 = vim.g.terminal_color_15,
          lualine = lualine.normal.a.bg,
        }))
        f:close()
        vim.cmd("qa!")`,
      );
      const p = Bun.spawnSync(["nvim", "--clean", "--headless", "-c", `luafile ${lua}`], { timeout: 30_000 });
      const file = Bun.file(out);
      expect({ exists: await file.exists(), stderr: p.stderr.toString() }).toEqual({ exists: true, stderr: "" });
      const r = await file.json();
      expect({ ok: r.ok, err: r.err, name: r.name, background: r.background }).toEqual({
        ok: true,
        err: "",
        name: "uiu",
        background: "light",
      });
      const roleHex = new Set([...t.roles.keys()].map((n) => t.role(n.slice(2)).hex));
      const foreign = Object.entries(r.colors as Record<string, string>).filter(([hex]) => !roleHex.has(hex));
      expect(foreign).toEqual([]);
      expect(r.term15).toBe(t.role("ansi-bright-white").hex);
      expect(r.lualine).toBe(t.role("accent-interactive").hex);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  // при обновлении nvim тест падает: перезапустить pnpm --filter theme-gen nvim:snapshot
  // и посмотреть git diff — новые группы со своими цветами покажет первый тест
  test("data/nvim-builtin.json matches installed nvim", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uiu-nvim-"));
    try {
      const out = join(dir, "builtin.json");
      Bun.spawnSync(
        ["nvim", "--clean", "--headless", "--cmd", `let g:uiu_out='${out}'`, "-c", `luafile ${SNAPSHOT_LUA}`],
        { timeout: 30_000 },
      );
      const now = await Bun.file(out).json();
      expect(now.nvim).toBe(builtin.nvim);
      expect(Object.keys(now.groups)).toEqual(Object.keys(builtin.groups));
      expect(now.groups).toEqual(builtin.groups);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
