# 2026-10-24 — разделение кита на owo и ai-generated, переименование в uiu

Большая сессия по витрине на GitHub Pages. Исходная задача: вычистить стили, развести «чистый owo» и сгенерированные ИИ компоненты на две страницы, вытащить из owo всё, что потерялось при переносе. По ходу репо переименовали в uiu, подключили версионирование и решили, что источник правды стилей переезжает из owo сюда.

## Что выяснили

- Источник правды для owo-слоя — `iwwwanow_owo/web/static/css/*` и шаблоны `web/templates/`. Сверено diff'ом с тем, что отдаёт iwwwanow.ru, — байт в байт. Доки owo (styling-guide, homepage, roadmap) устарели, их не учитываем. `/.meta/*.css` на iwwwanow.ru — кастом конкретного сайта (hero-колонки, теги, оверлей фреймов), к системе не относится и в кит не идёт.
- При первом переносе потерялись `card__dir-badge`, `card--span-2/4`, `grid--hidden`, header/footer, `position: absolute` у обложки, `outline: 0` в border-классах. Правило `hr` было скопировано дважды, а секция divider стояла после extended. В kit.css `body` был `DARK` — поэтому витрина выглядела серой, у owo текст чёрный.
- `hr_fieldset` в owo — не отдельный компонент, а заголовок каждой секции грида. В uiu решили показывать его как самостоятельный компонент, который ещё и умеет быть заголовком секции.
- Баги owo, найденные по дороге (заметки в owo `docs/backlog/`): `code { 1.6em }` компаундится внутри `p` (25.6px); Roboto Mono указан, но не грузится; Roboto импортируется, но не используется (возможно, задумывался для `p`); hr стоит вынести в компонент.
- Хлебные крошки «выглядели не так» — проверили computed-стили: Roboto Condensed 400, 14px, как у h5 в шапке. Подмены шрифта нет; вопрос пользователю, что именно смущает (размер / капс как в шапке), остался без ответа.

## Что сделано

- `owo.css` собирается `scripts/sync-owo.sh` из owo 1:1 (шрифтовой `@import` поднят наверх). В конец дописывается `scripts/owo-deviations.css` — явные расхождения со ссылкой на заметку owo. Пока там одно: `pre { 1.6rem }` + `code { 1em }`.
- `ai-generated.css` — бывшие extended-компоненты с суффиксом на каждом классе (`btn_ai-generated btn-primary_ai-generated`, `panel__body_ai-generated`). Приведены к owo: шкала h4/h5/h6/p, 1px LIGHT → DARK, интерактив синий (на пробу, финальное решение — после ручного теста), RED только danger, без скруглений (кроме radio и spinner) и transition, без капса. Toggle удалён: не нужен в ките. UI-карточка переименована в `panel`, чтобы не конфликтовать с `card__*` owo.
- `index.html` (owo) и `ai-generated.html` собраны только на разметке owo: `.wrapper`, `header.grid.header` со ссылками между страницами, секции через `hr_fieldset`, `footer`. Inline-стилей нет, только page-level `<style>`, как owo делает в `.meta`.
- `index.css` — точка входа вместо `kit.css`. `--RED` везде `#f00`.
- Обложки карточек и аватар — с iwwwanow.ru через `?static&width=W&height=H` (owo режет `imaging.Fill` по центру), в 2x, jpg в `assets/cards/`. Для `card--span-4` подобрана картинка со светлым левым нижним углом, иначе подпись не читалась.
- Лого пользователя `assets/logo.svg` (UiU, текст переведён в контуры) — фавикон. og-превью — `assets/logo-pattern.svg`: шахматка синий/серый под 45°, глифы наезжают по горизонтали; `og.svg` — его копия, `og.png` рендерится `rsvg-convert`.
- Переименование: GitHub `iwwwanow/ui-kit` → `iwwwanow/uiu`, Pages теперь `iwwwanow.github.io/uiu/` (старый адрес — 404, Pages не редиректит), локальная папка `iwwwanow_uiu`, память Claude скопирована в новый ключ пути.
- Версионирование как в xtc-toaster: semantic-release (commit-analyzer, notes, github) в `.github/workflows/release.yml`, туда же влит деплой Pages. Версия только в тегах; при деплое `__VERSION__` в html/`index.css` заменяется последним тегом, `og:image` получает `?v=` для сброса кэша превью. Базовый тег `v0.2.0` поставлен руками, первый автоматический релиз — `v0.3.0`.

## Решения на будущее

- Источник правды стилей owo переезжает в uiu. owo подключает uiu сабмодулем в `web/static/uiu` на теге; Docker уже делает `COPY . .`, нужен только `submodules: true` в checkout. Для одновременной правки — gitignored `docker-compose.override.yml` в owo, монтирует `../iwwwanow_uiu` поверх `/var/www/owo/static/uiu` (сервис `air`). Заметки: owo `docs/backlog/2026-10-24_uiu-source-of-truth.md`, `…_styles-from-uiu-submodule.md`, `…_dev-override-mount-uiu.md`; здесь `docs/backlog/2026-10-24_dev-override-mount-uiu.md`.

## Подводные камни

- Склеенный CSS: `@import` валиден только в начале файла — поэтому sync-скрипт поднимает шрифты наверх.
- `border` shorthand в ai-generated перебивает owo-классы вроде `border_dashed` (тот же вес, файл позже) — нужны собственные модификаторы (`badge-dashed_ai-generated`).
- В шелле `pkill -f '<строка>'` убивает и сам шелл, если строка есть в его команде; сервер гасить через `fuser -k 8765/tcp`.
- ImageMagick принимает `.raw` за RAW камеры — указывать формат явно (`jpg:file`).
- Telegram кэширует превью по URL страницы; обновить — через @WebpageBot.

## Остаток

- Ручной тест синего акцента в ai-generated → окончательное решение (синий / красный).
- Хлебные крошки: выяснить, что не так (размер 16px как ссылки в `p` или капс-h5 как в шапке).
- Перенос источника правды в owo-репо: сабмодуль, `submodules: true` в `release.yml` owo, `index.css` owo → импорт uiu, удалить `sync-owo.sh` и `owo-deviations.css` здесь.
- Баги owo из бэклога (code, Roboto Mono, Roboto, hr) чинить уже в uiu после переноса.
