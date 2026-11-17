-- Снимок групп подсветки nvim в JSON, по группе на строку, ключи отсортированы (читаемый git diff).
--
-- Встроенные группы и ссылки по умолчанию (data/nvim-builtin.json, его читают тесты):
--   pnpm --filter theme-gen nvim:snapshot
--
-- Группы плагинов — изредка, руками, после обновления плагинов: поднимает lazy.nvim со
-- спекой пользователя (require("plugins")) без тем (g:uiu_skip, по умолчанию monochrome)
-- и грузит все плагины. Через init.lua нельзя: после `colorscheme default` группы темы
-- остаются пустыми ({}), и плагины с `default = true` их уже не заполняют.
--   nvim --headless --cmd "let g:uiu_out='/tmp/user.json' | let g:uiu_user=v:true" -u nvim-hl-snapshot.lua
-- Новые группы со своими hex (не ссылки) — в PLUGIN_GROUPS теста test/nvim.test.ts.
local out = assert(vim.g.uiu_out, "g:uiu_out is not set")

local function encode(def)
  local keys = vim.tbl_keys(def)
  table.sort(keys)
  local parts = {}
  for _, k in ipairs(keys) do
    local v = def[k]
    if type(v) == "number" and (k == "fg" or k == "bg" or k == "sp") then
      v = string.format("#%06x", v)
    end
    table.insert(parts, vim.json.encode(k) .. ":" .. vim.json.encode(v))
  end
  return "{" .. table.concat(parts, ",") .. "}"
end

local function snapshot()
  local groups = vim.api.nvim_get_hl(0, {})
  local names = vim.tbl_keys(groups)
  table.sort(names)
  local lines = {}
  for _, name in ipairs(names) do
    table.insert(lines, " " .. vim.json.encode(name) .. ": " .. encode(groups[name]))
  end
  local f = assert(io.open(out, "w"))
  f:write('{\n "nvim": ', vim.json.encode(tostring(vim.version())), ',\n "groups": {\n')
  f:write(table.concat(lines, ",\n"), "\n }\n}\n")
  f:close()
end

if vim.g.uiu_user then
  local skip = vim.g.uiu_skip or { "monochrome" }
  -- скрипт стоит вместо init.lua (-u): lazy.setup должен идти во время старта
  vim.opt.rtp:prepend(vim.fn.stdpath("data") .. "/lazy/lazy.nvim")
  vim.o.termguicolors = true
  local spec = vim.tbl_filter(function(p)
    local name = type(p) == "table" and p[1] or p
    for _, s in ipairs(skip) do
      if type(name) == "string" and name:find(s, 1, true) then return false end
    end
    return true
  end, require("plugins"))
  local lazy = require("lazy")
  lazy.setup(spec, { install = { missing = false }, checker = { enabled = false },
    change_detection = { enabled = false }, lockfile = vim.fn.tempname() })
  lazy.load({ plugins = vim.tbl_map(function(p) return p.name end, lazy.plugins()), wait = true })
end

-- часть плагинов ставит группы по VimEnter, через vim.schedule / defer
local function finish()
  vim.defer_fn(function()
    snapshot()
    vim.cmd("qa!")
  end, 200)
end
if vim.v.vim_did_enter == 1 then
  finish()
else
  vim.api.nvim_create_autocmd("VimEnter", { once = true, callback = finish })
end
