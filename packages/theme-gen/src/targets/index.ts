import type { Theme } from "../theme";
import { base16 } from "./base16";
import { delta } from "./delta";
import { dunst } from "./dunst";
import { ghostty } from "./ghostty";
import { nvimColors, nvimInit, nvimLualine } from "./nvim";
import { tofi } from "./tofi";
import { vhs } from "./vhs";
import { waybar } from "./waybar";
import { zellij } from "./zellij";

/** Выходы генератора: путь относительно корня репо → содержимое. */
export const TARGETS: Record<string, (t: Theme) => string> = {
  "themes/ghostty/uiu.conf": ghostty,
  "themes/waybar/colors.css": waybar,
  "themes/zellij/uiu.kdl": zellij,
  "themes/base16/uiu.yaml": base16,
  "themes/delta/uiu.gitconfig": delta,
  "themes/vhs/uiu.tape": vhs,
  "themes/tofi/uiu.conf": tofi,
  "themes/dunst/uiu.conf": dunst,
  "colors/uiu.lua": nvimColors,
  "lua/uiu/init.lua": nvimInit,
  "lua/lualine/themes/uiu.lua": nvimLualine,
};
