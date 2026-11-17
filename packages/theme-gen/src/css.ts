// Чтение CSS-переменных из файлов темы и разрешение var() цепочек.

/** Все объявления `--name: value;` из CSS (комментарии вырезаются).
 *  Повтор имени — ошибка; `firstWins` — для чужого CSS, где переменные
 *  переопределяются в @media (берётся первое, то есть :root). */
export function parseVars(css: string, source = "css", { firstWins = false } = {}): Map<string, string> {
  const vars = new Map<string, string>();
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;{}]+);/g)) {
    const [, name, value] = m;
    if (vars.has(name!)) {
      if (firstWins) continue;
      throw new Error(`${source}: ${name} declared twice`);
    }
    vars.set(name!, value!.trim());
  }
  return vars;
}

const VAR_RE = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;

/** Значение переменной с разрешёнными var(); ошибка на неизвестной переменной и цикле. */
export function resolveVar(vars: Map<string, string>, name: string, seen: string[] = []): string {
  if (seen.includes(name)) throw new Error(`var cycle: ${[...seen, name].join(" → ")}`);
  const value = vars.get(name);
  if (value === undefined) {
    throw new Error(seen.length ? `undefined ${name} (via ${seen.join(" → ")})` : `undefined ${name}`);
  }
  const m = value.match(VAR_RE);
  return m ? resolveVar(vars, m[1]!, [...seen, name]) : value;
}

/** Цепочка ссылок: --surface-chrome → --GRAY-94. */
export function refChain(vars: Map<string, string>, name: string): string[] {
  const chain = [name];
  let m = vars.get(name)?.match(VAR_RE);
  while (m) {
    chain.push(m[1]!);
    m = vars.get(m[1]!)?.match(VAR_RE);
  }
  return chain;
}
