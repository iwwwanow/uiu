import { describe, expect, test } from "bun:test";
import chromeHex from "./fixtures/chrome-hex.json";
import {
  contrast,
  hexToRgb,
  inGamut,
  oklchToRgb,
  parseColor,
  rgbToOklch,
  toHex,
} from "../src/color";

describe("hex", () => {
  test("short and long forms", () => {
    expect(toHex(hexToRgb("#fff"))).toBe("#ffffff");
    expect(toHex(hexToRgb("#E0E0E0"))).toBe("#e0e0e0");
  });
  test("rejects garbage", () => {
    expect(() => hexToRgb("#12")).toThrow();
    expect(() => hexToRgb("#gggggg")).toThrow();
  });
});

describe("oklch", () => {
  test("owo grays have the L their step names claim", () => {
    // имя ступени = L × 100, округлённо
    expect(rgbToOklch(hexToRgb("#e0e0e0")).l).toBeCloseTo(0.907, 3);
    expect(rgbToOklch(hexToRgb("#a4a4a4")).l).toBeCloseTo(0.719, 3);
    expect(rgbToOklch(hexToRgb("#535353")).l).toBeCloseTo(0.442, 3);
    expect(rgbToOklch(hexToRgb("#292929")).l).toBeCloseTo(0.281, 3);
  });

  test("round trip oklch → rgb → oklch", () => {
    const c = { l: 0.5, c: 0.134, h: 248.1 };
    const back = rgbToOklch(oklchToRgb(c));
    expect(back.l).toBeCloseTo(c.l, 6);
    expect(back.c).toBeCloseTo(c.c, 6);
    expect(back.h).toBeCloseTo(c.h, 4);
  });

  test("percent lightness", () => {
    expect(toHex(parseColor("oklch(96% 0 0)"))).toBe(toHex(parseColor("oklch(0.96 0 0)")));
  });

  test("gamut", () => {
    expect(inGamut(oklchToRgb({ l: 0.5, c: 0.12, h: 156.4 }))).toBe(true);
    expect(inGamut(oklchToRgb({ l: 0.95, c: 0.3, h: 156.4 }))).toBe(false);
  });

  test("unsupported syntax is an error, not a silent black", () => {
    expect(() => parseColor("rgb(0 0 0)")).toThrow();
    expect(() => parseColor("oklch(0.5 0.1)")).toThrow();
  });
});

// Эталон снят с превью (theme/scale.html) в Chromium: hex генератора должен
// совпадать с тем, что видно в браузере, иначе превью врёт о результате.
describe("matches Chrome", () => {
  for (const [value, hex] of Object.entries(chromeHex)) {
    test(value, () => expect(toHex(parseColor(value))).toBe(hex));
  }
});

describe("contrast", () => {
  test("WCAG reference values", () => {
    expect(contrast(hexToRgb("#000"), hexToRgb("#fff"))).toBeCloseTo(21, 5);
    expect(contrast(hexToRgb("#fff"), hexToRgb("#fff"))).toBeCloseTo(1, 5);
    expect(contrast(hexToRgb("#f00"), hexToRgb("#fff"))).toBeCloseTo(4, 1);
  });
});
