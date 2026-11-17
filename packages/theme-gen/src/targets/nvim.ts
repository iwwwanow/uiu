// nvim: плагин-тема в корне репо (lazy.nvim не берёт плагин из подкаталога).
//   colors/uiu.lua              :colorscheme uiu
//   lua/uiu/init.lua            роли → hex, группы, терминальные цвета, load()
//   lua/lualine/themes/uiu.lua  lualine с theme = "auto" ищет тему по g:colors_name
//
// Задаём только базовые группы — остальное держится на встроенных ссылках nvim
// (@keyword → Keyword → Statement, DiagnosticSignError → DiagnosticError, …) и на ссылках
// плагинов (TelescopeNormal → Normal, OilDir → Directory). Перекрываем группы, у которых
// по умолчанию свои цвета, и те, что по умолчанию ссылаются на NonText: MAGENTA — только
// у конца строки. Цвет — только у состояний; синтаксис — два тона серого, курсив у
// комментариев, без жирного.

import type { Theme } from "../theme";

type Attrs = {
  fg?: string;
  bg?: string;
  sp?: string;
  italic?: true;
  underline?: true;
  undercurl?: true;
  strikethrough?: true;
  blend?: number;
};
export type Spec = Attrs | { link: string };

const faint = { fg: "text-faint" };

export const GROUPS: Record<string, Spec> = {
  // --- поверхности: -1 sunken, 0 base, 1 chrome, 2 overlay ---
  Normal: { fg: "text", bg: "surface-base" },
  NormalNC: { fg: "text", bg: "surface-sunken" },
  NormalFloat: { fg: "text", bg: "surface-overlay" },
  FloatBorder: { fg: "border-strong", bg: "surface-overlay" },
  FloatTitle: { fg: "text-strong", bg: "surface-overlay" },
  FloatFooter: { fg: "text-faint", bg: "surface-overlay" },
  FloatShadow: { bg: "border-strong", blend: 80 },
  FloatShadowThrough: { bg: "border-strong", blend: 100 },
  StatusLine: { fg: "text-muted", bg: "surface-chrome" },
  StatusLineNC: { fg: "text-faint", bg: "surface-chrome" },
  TabLine: { fg: "text-muted", bg: "surface-chrome" },
  TabLineSel: { fg: "text-strong", bg: "surface-base" },
  WinBar: { fg: "text-muted" },
  WinBarNC: faint,
  WinSeparator: { fg: "border-subtle" },
  MsgSeparator: { link: "WinSeparator" },

  // --- колонки слева, строка курсора ---
  LineNr: faint,
  CursorLineNr: { fg: "text-strong" },
  SignColumn: faint,
  Folded: { fg: "text-muted", bg: "surface-sunken" },
  CursorLine: { bg: "surface-base-hover" },
  CursorColumn: { bg: "surface-base-hover" },
  ColorColumn: { bg: "surface-base-hover" },
  Cursor: { fg: "surface-base", bg: "text" },
  lCursor: { link: "Cursor" },

  // --- невидимые символы: MAGENTA только у конца строки ---
  NonText: { fg: "marker-invisible" },
  Whitespace: { fg: "marker-whitespace" },
  EndOfBuffer: { fg: "marker-whitespace" },
  SpecialKey: faint,
  Conceal: faint,

  // --- выделение и поиск ---
  Visual: { bg: "accent-selection" },
  Search: { fg: "text", bg: "accent-search" },
  CurSearch: { fg: "text-on-accent", bg: "accent-search-current" },
  MatchParen: { fg: "text-strong", underline: true },
  QuickFixLine: { bg: "accent-menu-selection" },

  // --- всплывающее меню (overlay) ---
  Pmenu: { fg: "text", bg: "surface-overlay" },
  PmenuSel: { fg: "text-strong", bg: "accent-menu-selection" },
  PmenuKind: { fg: "text-faint", bg: "surface-overlay" },
  PmenuKindSel: { fg: "text-faint", bg: "accent-menu-selection" },
  PmenuExtra: { fg: "text-faint", bg: "surface-overlay" },
  PmenuExtraSel: { fg: "text-faint", bg: "accent-menu-selection" },
  PmenuMatch: { fg: "accent-match", bg: "surface-overlay" },
  PmenuMatchSel: { fg: "accent-match", bg: "accent-menu-selection" },
  PmenuThumb: { bg: "text-disabled" },
  PmenuBorder: { link: "FloatBorder" },
  ComplHint: faint,

  // --- сообщения ---
  ErrorMsg: { fg: "state-error" },
  WarningMsg: { fg: "state-warning" },
  OkMsg: { fg: "state-added" },
  ModeMsg: { fg: "text-muted" },
  MoreMsg: { fg: "text-muted" },
  Question: { fg: "text-strong" },
  Title: { fg: "text-strong" },
  Directory: { fg: "text-strong" },

  // --- diff: подложки строк только здесь, в обычном буфере git — только знак ---
  DiffAdd: { bg: "state-added-bg" },
  DiffChange: { bg: "state-changed-bg" },
  DiffDelete: { fg: "state-removed", bg: "state-removed-bg" },
  DiffText: { fg: "state-changed", bg: "state-changed-bg" },
  Added: { fg: "state-added" },
  Changed: { fg: "state-changed" },
  Removed: { fg: "state-removed" },

  // --- орфография ---
  SpellBad: { undercurl: true, sp: "state-error" },
  SpellCap: { undercurl: true, sp: "state-warning" },
  SpellLocal: { undercurl: true, sp: "state-info" },
  SpellRare: { undercurl: true, sp: "state-hint" },

  // --- диагностика: Sign/VirtualText/Floating ссылаются на эти пять ---
  DiagnosticError: { fg: "state-error" },
  DiagnosticWarn: { fg: "state-warning" },
  DiagnosticInfo: { fg: "state-info" },
  DiagnosticHint: { fg: "state-hint" },
  DiagnosticOk: { fg: "state-added" },
  DiagnosticUnderlineError: { undercurl: true, sp: "state-error" },
  DiagnosticUnderlineWarn: { undercurl: true, sp: "state-warning" },
  DiagnosticUnderlineInfo: { undercurl: true, sp: "state-info" },
  DiagnosticUnderlineHint: { undercurl: true, sp: "state-hint" },
  DiagnosticUnderlineOk: { undercurl: true, sp: "state-added" },
  DiagnosticDeprecated: { strikethrough: true },
  LspInlayHint: { fg: "text-disabled" },
  LspCodeLens: { fg: "text-disabled" },

  // --- синтаксис (group-name; treesitter и LSP ссылаются сюда по умолчанию) ---
  Comment: { fg: "syntax-comment", italic: true },
  Constant: { fg: "syntax-constant" },
  String: { fg: "syntax-string" },
  Identifier: { fg: "syntax-variable" },
  "@variable": { fg: "syntax-variable" },
  Function: { fg: "syntax-function" },
  Statement: { fg: "syntax-keyword" },
  PreProc: { fg: "syntax-keyword" },
  Type: { fg: "syntax-type" },
  Special: { fg: "syntax-constant" },
  Operator: { fg: "syntax-punctuation" },
  Delimiter: { fg: "syntax-punctuation" },
  Todo: { fg: "text-strong", italic: true },
  Error: { fg: "state-error" },
  // разделители заголовков во встроенной справке
  "@markup.heading.1.delimiter.vimdoc": faint,
  "@markup.heading.2.delimiter.vimdoc": faint,

  // --- служебные группы nvim ---
  NvimInternalError: { fg: "text-on-accent", bg: "state-error" },
  RedrawDebugClear: { bg: "state-warning-bg" },
  RedrawDebugComposed: { bg: "state-added-bg" },
  RedrawDebugRecompose: { bg: "state-removed-bg" },

  // --- плагины: группы со своими hex или со ссылкой на NonText ---
  // telescope: окна плавающие — уровень overlay, как на превью
  TelescopeNormal: { link: "NormalFloat" },
  TelescopeBorder: { link: "FloatBorder" },
  TelescopeTitle: { link: "FloatTitle" },
  TelescopeSelection: { link: "PmenuSel" },
  TelescopeMatching: { fg: "accent-match" },
  TelescopePromptCounter: faint,
  TelescopePreviewHyphen: faint,
  TelescopeResultsDiffUntracked: faint,
  // nvim-cmp: *Default у cmp свои hex, перекрываем группы над ними
  CmpItemAbbrDeprecated: { fg: "text-disabled", strikethrough: true },
  CmpItemAbbrMatch: { fg: "accent-match" },
  CmpItemAbbrMatchFuzzy: { link: "CmpItemAbbrMatch" },
  CmpItemKind: faint,
  CmpItemKindIcon: faint,
  CmpItemMenu: faint,
  // nvim-web-devicons с color_icons = false — все иконки этим цветом
  DevIconDefault: { fg: "accent-interactive" },
  // gitsigns: Staged* он смешивает из обычных знаков (не цвета палитры) — staged серым
  GitSignsCurrentLineBlame: { fg: "text-disabled" },
  GitSignsAddInline: { fg: "state-added", bg: "state-added-bg" },
  GitSignsChangeInline: { fg: "state-changed", bg: "state-changed-bg" },
  GitSignsDeleteInline: { fg: "state-removed", bg: "state-removed-bg" },
  GitSignsDiffStaged: { link: "DiffChange" },
  ...staged(),
};

function staged(): Record<string, Spec> {
  const out: Record<string, Spec> = {};
  for (const kind of ["Add", "Change", "Changedelete", "Delete", "Topdelete", "Untracked"]) {
    for (const part of ["", "Nr", "Cul"]) out[`GitSignsStaged${kind}${part}`] = { fg: "state-hint" };
    // у удалений строки нет — подложку некуда ставить
    if (kind !== "Delete" && kind !== "Topdelete") {
      out[`GitSignsStaged${kind}Ln`] = { link: `GitSigns${kind}Ln` };
    }
  }
  return out;
}

const ANSI = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
const TERMINAL = [...ANSI.map((n) => `ansi-${n}`), ...ANSI.map((n) => `ansi-bright-${n}`)];

const HEADER = [
  "-- uiu — nvim colorscheme (light)",
  "-- generated by packages/theme-gen from theme/*.css — do not edit by hand",
];

const luaKey = (k: string) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : `["${k}"]`);
const luaRole = (role: string) => `c.${role.replaceAll("-", "_")}`;

function luaSpec(t: Theme, spec: Spec): string {
  if ("link" in spec) return `{ link = "${spec.link}" }`;
  const parts = Object.entries(spec).map(([k, v]) => {
    if (k === "fg" || k === "bg" || k === "sp") {
      t.role(v as string); // неизвестная роль — ошибка генерации
      return `${k} = ${luaRole(v as string)}`;
    }
    return `${k} = ${v}`;
  });
  return `{ ${parts.join(", ")} }`;
}

export function nvimInit(t: Theme): string {
  const roles = [...t.roles.keys()].map((n) => n.slice(2));
  const width = Math.max(...roles.map((r) => r.length));
  const step = (r: string) => t.roles.get(`--${r}`)!.match(/var\(--([\w-]+)\)/)?.[1] ?? "";
  return [
    ...HEADER,
    "",
    "local M = {}",
    "",
    "-- роли theme/roles.css: имя через подчёркивание → hex (в комментарии — ступень палитры)",
    "M.colors = {",
    ...roles.map((r) => `  ${r.replaceAll("-", "_").padEnd(width)} = "${t.role(r).hex}", -- ${step(r)}`),
    "}",
    "",
    "local c = M.colors",
    "",
    "M.groups = {",
    ...Object.entries(GROUPS).map(([name, spec]) => `  ${luaKey(name)} = ${luaSpec(t, spec)},`),
    "}",
    "",
    "-- g:terminal_color_0 … 15",
    `M.terminal = { ${TERMINAL.map(luaRole).join(", ")} }`,
    "",
    "function M.load()",
    '  vim.cmd("highlight clear")',
    "  -- 'background' перезагружает тему из g:colors_name — меняем, пока имени нет",
    "  vim.g.colors_name = nil",
    '  if vim.o.background ~= "light" then',
    '    vim.o.background = "light"',
    "  end",
    '  vim.g.colors_name = "uiu"',
    "  for name, spec in pairs(M.groups) do",
    "    vim.api.nvim_set_hl(0, name, spec)",
    "  end",
    "  for i, color in ipairs(M.terminal) do",
    '    vim.g["terminal_color_" .. (i - 1)] = color',
    "  end",
    "end",
    "",
    "return M",
    "",
  ].join("\n");
}

export function nvimColors(): string {
  return [...HEADER, 'require("uiu").load()', ""].join("\n");
}

// lualine: режимы одним акцентом (цвет — только у состояний), b/c — chrome, как на превью
export function nvimLualine(): string {
  return [
    ...HEADER,
    'local c = require("uiu").colors',
    "local section = { fg = c.text_muted, bg = c.surface_chrome }",
    "local mode = { a = { fg = c.text_on_accent, bg = c.accent_interactive }, b = section, c = section }",
    "local inactive = { fg = c.text_faint, bg = c.surface_chrome }",
    "return {",
    "  normal = mode,",
    "  insert = mode,",
    "  visual = mode,",
    "  replace = mode,",
    "  command = mode,",
    "  terminal = mode,",
    "  inactive = { a = inactive, b = inactive, c = inactive },",
    "}",
    "",
  ].join("\n");
}
