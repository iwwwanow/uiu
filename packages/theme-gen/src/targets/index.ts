import type { Theme } from "../theme";
import { ghostty } from "./ghostty";
import { waybar } from "./waybar";

/** Выходы генератора: путь относительно корня репо → содержимое. */
export const TARGETS: Record<string, (t: Theme) => string> = {
  "themes/ghostty/uiu.conf": ghostty,
  "themes/waybar/colors.css": waybar,
};
