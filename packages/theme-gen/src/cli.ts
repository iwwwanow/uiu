// theme-gen: theme/*.css → конфиги программ в themes/.
//
//   bun run src/cli.ts           записать файлы
//   bun run src/cli.ts --check   только сверить: exit 1, если файлы в репо устарели

import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { loadTheme, REPO_ROOT } from "./theme";
import { TARGETS } from "./targets";

const check = process.argv.includes("--check");
const theme = await loadTheme();
let stale = 0;

for (const [rel, render] of Object.entries(TARGETS)) {
  const path = join(REPO_ROOT, rel);
  const next = render(theme);
  const file = Bun.file(path);
  const prev = (await file.exists()) ? await file.text() : null;
  if (prev === next) {
    console.log(`  ok    ${rel}`);
    continue;
  }
  if (check) {
    stale++;
    console.log(`  stale ${rel}`);
    continue;
  }
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, next);
  console.log(`  wrote ${rel}`);
}

if (stale) {
  console.error(`\n${stale} file(s) out of date — run: pnpm theme:build`);
  process.exit(1);
}
