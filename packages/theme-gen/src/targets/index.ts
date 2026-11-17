import type { Theme } from "../theme";
import { ghostty } from "./ghostty";
import { nvimColors, nvimInit, nvimLualine } from "./nvim";
import { waybar } from "./waybar";

/** Выходы генератора: путь относительно корня репо → содержимое. */
export const TARGETS: Record<string, (t: Theme) => string> = {
  "themes/ghostty/uiu.conf": ghostty,
  "themes/waybar/colors.css": waybar,
  "colors/uiu.lua": nvimColors,
  "lua/uiu/init.lua": nvimInit,
  "lua/lualine/themes/uiu.lua": nvimLualine,
};
