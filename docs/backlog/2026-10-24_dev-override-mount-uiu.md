# Dev-режим owo + uiu: override-монтирование рабочей копии uiu

uiu — источник правды стилей owo; owo подключает его сабмодулем в `web/static/uiu`, закреплённым на теге. Чтобы проверять правки uiu прямо в owo, не коммитя в сабмодуль, в owo заводится gitignored `docker-compose.override.yml`. Он монтирует эту рабочую копию (`../iwwwanow_uiu`) поверх `/var/www/owo/static/uiu` в dev-сервисе `air`. Правки CSS здесь сразу видны на локальном owo. Когда всё готово: коммит в uiu → semantic-release ставит тег → в owo `git -C web/static/uiu checkout vX.Y.Z` и коммит указателя.

```yaml
# iwwwanow_owo/docker-compose.override.yml (gitignored)
services:
  air:
    volumes:
      - ../iwwwanow_uiu:/var/www/owo/static/uiu
```

Подробнее в owo: `docs/backlog/2026-10-24_dev-override-mount-uiu.md`, `2026-10-24_styles-from-uiu-submodule.md`, `2026-10-24_uiu-source-of-truth.md`.
