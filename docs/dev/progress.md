# Прогресс

Статус реализации по шагам из `prompt-1.md` ("ПОРЯДОК РЕАЛИЗАЦИИ"). Обновляется
по ходу работы, чтобы не терять контекст между сессиями.

## Сделано

**1. Локальный сервер, отдающий папку с файлами + сам редактор**
- Монорепо: корень — pnpm workspace (`pnpm-workspace.yaml`), редактор —
  `packages/editor` (SvelteKit, TypeScript, Svelte 5 runes, без UI-библиотеки).
- `.github/workflows/pages.yml` подправлен: GitHub Pages деплоит только
  застейдженные файлы showcase (`index.html`, `kit.css`, favicon, og.*), не
  весь монорепо.
- `src/routes/api/files/+server.ts` — `GET` отдаёт список `.html` файлов
  (`FILES_ROOT`, дефолт `packages/editor/sample`) и по `?path=` — сырое
  содержимое любого файла (html/css), с защитой от path traversal. Запись
  (`PUT`/`POST`) пока не реализована — это шаг 8.
- `packages/editor/sample/` — тестовые `index.html` + `styles.css` для
  локальной разработки (не трогаем настоящий `index.html`/`kit.css` в корне
  репо, пока viewport не обкатан).
- `Dockerfile` + `docker-compose.yml` в корне — dev-сервер редактора,
  volume пробрасывает только `packages/editor/sample` → `/data` (`FILES_ROOT`).
  Собран, но полный прогон `docker compose up` ещё не проверялся вживую —
  на подтверждение перед следующим шагом.

**2. Pan + zoom viewport, рендер frame из открытого файла**
- `src/lib/Viewport.svelte` — колесо мыши зумит вокруг курсора
  (`transform: translate() scale()`), драг по пустому фону (не по frame) —
  панорамирование. Top-bar: имя файла + `%` zoom, клик сбрасывает к 100%.
- `src/lib/Frame.svelte` — рендерит `<body>` открытого файла как живой DOM.
  Важный приём: контейнер — это **настоящий `<body>`-элемент**
  (`document.createElement('body')`), а не `<div>` — иначе CSS-правила вида
  `body { ... }` (тег-селектор) не матчатся вообще, независимо от
  скопированных class/id/style. Нашли это на practice: `display:flex` на
  body в sample-css не применялся, карточки лежали в столбец вместо ряда.
- Фрейм **без фиксированного размера** — `.frame { display: inline-block }`
  сам сжимается по контенту или принимает размер, если он явно задан в CSS
  на `body`/`html`. Хардкода `1440×900` больше нет.
- Верхний frame рендерится в том же документе, что и сам редактор (НЕ
  iframe) — чтобы будущие инструменты выделения/CSS-редактирования могли
  напрямую работать с `el.style`/classList без границы фрейма. `<iframe>`
  зарезервирован под вложенные `.html`-фреймы (шаг 7).

## Инфраструктурные заметки

- pnpm — установка зависимостей и workspace, bun — рантайм для скриптов
  (`bun run dev`). Нужен `packages/editor/bunfig.toml` с `[run]\nbun = true` —
  без этого `bun run dev` всё равно шеллится в системный `node` через
  shebang `vite`-бинарника (`#!/usr/bin/env node`), и если это старый node —
  всё падает.
- На машине стоял Node 18 по умолчанию — обновили до последнего (v26.4.0)
  через nvm, pnpm — до последнего (11.10.0, старые версии требуют node
  ≥22.13), bun обновлён до 1.3.14.
- Dev-сервер поднимается через `cd packages/editor && bun run dev` — порт
  5173 на машине часто занят посторонним процессом, vite сам переезжает на
  5174.

## Дальше (шаги 3–8 из prompt-1.md, не начаты)

3. Инструмент "div" — вставка, выделение, reorder среди siblings.
4. span, text, img по той же схеме.
5. Right panel: raw CSS editor + class manager для выбранного элемента.
6. Root CSS browser (общий styles.css).
7. Инструмент `.html` — создание файла, вставка `<iframe>`, линковка
   общего styles.css, проверка same-origin доступа внутрь iframe.
8. Сохранение обратно в файлы (`PUT`/`POST` в `/api/files`).

Layers-дерево (из `ui-application-structure.md`) понадобится вместе с
шагом 3 — reorder среди siblings без него неюзабелен.
