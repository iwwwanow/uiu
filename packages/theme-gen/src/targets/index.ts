import type { Theme } from "../theme";
import { base16 } from "./base16";
import { ghostty } from "./ghostty";
import { nvimColors, nvimInit, nvimLualine } from "./nvim";
import { waybar } from "./waybar";
import { zellij } from "./zellij";

/** Выходы генератора: путь относительно корня репо → содержимое. */
export const TARGETS: Record<string, (t: Theme) => string> = {
  "themes/ghostty/uiu.conf": ghostty,
  "themes/waybar/colors.css": waybar,
  "themes/zellij/uiu.kdl": zellij,
  "themes/base16/uiu.yaml": base16,
  "colors/uiu.lua": nvimColors,
  "lua/uiu/init.lua": nvimInit,
  "lua/lualine/themes/uiu.lua": nvimLualine,
};
