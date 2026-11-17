// Цвет: разбор CSS-значений (hex, oklch()) и перевод OKLCH ↔ sRGB.
// Матрицы — из CSS Color 4 (w3c/csswg-drafts, conversions.js), те же, что в браузерах:
// hex генератора должен совпадать с тем, что Chrome показывает на превью.

export type RGB = [number, number, number]; // sRGB, гамма-кодированный, 0..1
export type OKLCH = { l: number; c: number; h: number };

type M3 = [[number, number, number], [number, number, number], [number, number, number]];
const mul = (m: M3, v: RGB): RGB => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

const OKLAB_TO_LMS: M3 = [
  [1.0, 0.3963377773761749, 0.2158037573099136],
  [1.0, -0.1055613458156586, -0.0638541728258133],
  [1.0, -0.0894841775298119, -1.2914855480194092],
];
const LMS_TO_XYZ: M3 = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];
const XYZ_TO_LIN_SRGB: M3 = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
  [705 / 12673, -2585 / 12673, 705 / 667],
];
const LIN_SRGB_TO_XYZ: M3 = [
  [506752 / 1228815, 87881 / 245763, 12673 / 70218],
  [87098 / 409605, 175762 / 245763, 12673 / 175545],
  [7918 / 409605, 87881 / 737289, 1001167 / 1053270],
];
const XYZ_TO_LMS: M3 = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const LMS_TO_OKLAB: M3 = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.4285922420485799, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];

const gam = (v: number) => {
  const a = Math.abs(v);
  return a > 0.0031308 ? Math.sign(v) * (1.055 * a ** (1 / 2.4) - 0.055) : 12.92 * v;
};
const lin = (v: number) => {
  const a = Math.abs(v);
  return a <= 0.04045 ? v / 12.92 : Math.sign(v) * ((a + 0.055) / 1.055) ** 2.4;
};

/** OKLCH → sRGB (гамма). Без подрезки: значения вне 0..1 — вне гаммы sRGB. */
export function oklchToRgb({ l, c, h }: OKLCH): RGB {
  const rad = (h * Math.PI) / 180;
  const lab: RGB = [l, c * Math.cos(rad), c * Math.sin(rad)];
  const lms = mul(OKLAB_TO_LMS, lab).map((x) => x ** 3) as RGB;
  return mul(XYZ_TO_LIN_SRGB, mul(LMS_TO_XYZ, lms)).map(gam) as RGB;
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const lms = mul(XYZ_TO_LMS, mul(LIN_SRGB_TO_XYZ, rgb.map(lin) as RGB)).map(Math.cbrt) as RGB;
  const [l, a, b] = mul(LMS_TO_OKLAB, lms);
  const c = Math.hypot(a, b);
  const h = c < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
}

const GAMUT_EPS = 1e-4;
export const inGamut = (rgb: RGB) => rgb.every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS);

export function toHex(rgb: RGB): string {
  return (
    "#" +
    rgb
      .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) h = [...h].map((x) => x + x).join("");
  if (!/^[0-9a-f]{6}$/.test(h)) throw new Error(`bad hex color: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
}

/** Разбирает CSS-значение цвета: #rgb, #rrggbb, oklch(L C H) (L — число или %). */
export function parseColor(value: string): RGB {
  const v = value.trim();
  if (v.startsWith("#")) return hexToRgb(v);
  const m = v.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i);
  if (m) {
    const l = parseFloat(m[1]!) / (m[2] ? 100 : 1);
    return oklchToRgb({ l, c: parseFloat(m[3]!), h: parseFloat(m[4]!) });
  }
  throw new Error(`unsupported color value: ${value}`);
}

/** WCAG 2 relative luminance и контраст. */
export function luminance(rgb: RGB): number {
  const [r, g, b] = rgb.map((v) => lin(Math.min(1, Math.max(0, v))));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contrast(a: RGB, b: RGB): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}
