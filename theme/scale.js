// Подписи образцов: исходное значение переменной, hex и OKLCH L.
// Перечитывает переменные раз в полсекунды — правки в DevTools видны сразу.
// Для ступеней, совпадающих с owo (data-owo), проверяет, что hex совпадает с токеном owo.

const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const root = document.documentElement;

function toHex(css) {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function oklchL(hex) {
  const lin = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [lin(1), lin(3), lin(5)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

for (const el of document.querySelectorAll("[data-var]")) {
  el.insertAdjacentHTML(
    "afterbegin",
    `<div class="swatch__chip"></div><div class="swatch__name">${el.dataset.var}</div><div class="swatch__value"></div>`,
  );
  el.querySelector(".swatch__chip").style.background = `var(${el.dataset.var})`;
}

function render() {
  const style = getComputedStyle(root);
  for (const el of document.querySelectorAll("[data-var]")) {
    const name = el.dataset.var;
    const raw = style.getPropertyValue(name).trim();
    const hex = toHex(raw);
    let text = `${raw}\n${hex} · L ${oklchL(hex).toFixed(3)}`;
    let warn = false;
    if (el.dataset.owo) {
      const owoHex = toHex(style.getPropertyValue(el.dataset.owo).trim());
      warn = owoHex !== hex;
      text += warn ? `\n≠ ${el.dataset.owo} ${owoHex}` : `\n= ${el.dataset.owo}`;
    }
    const value = el.querySelector(".swatch__value");
    if (value.textContent !== text) value.textContent = text;
    value.classList.toggle("swatch__value_warn", warn);
  }
}

render();
setInterval(render, 500);
