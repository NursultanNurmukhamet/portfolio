# Nursultan Nurmukhamet — портфолио

Личное портфолио Нурсултана Нурмухамета — Backend / Infrastructure Engineer. Главная устроена как инвентарь: короткое представление (имя, роль, факты, резюме, контакты, счётчики полок), затем все предметы по категориям — рабочие системы, личные проекты, железо, инфраструктура, сертификаты и учёба. У каждого предмета картинка, одна строка и окно подробностей со стеком, ссылками и навигацией «вперёд/назад»; поиск и вкладки фильтруют сетку, `#item=<id>` открывает предмет по прямой ссылке. Данные предметов — `dist/inventory.js`, разметка — `dist/index.html`, стили и логика — `dist/home.css` / `dist/home.js`, обложки без фото берутся из `dist/gallery.js`. Внутренние страницы (кейс MyLab, университетские проекты) используют те же токены `dist/tui.css` и общую анимацию `dist/shell.css` / `dist/shell.js`.

[Открыть сайт](https://nursultannurmukhamet.github.io/portfolio/)

## Содержимое

- `dist/` — статический сайт, который публикуется на GitHub Pages.
- `dist/mylab.html` — кейс MyLab: персональная инфраструктура (Proxmox, Kubernetes, Grafana, восстановление).
- `dist/projects/university/` — университетские проекты и сертификат.
- `src/` — редактируемая 3D-сцена, исходная графика и локальная копия Three.js.
- `scripts/build-assets.mjs` — воспроизводимая оптимизация 3D и изображения без потери качества.
- `scripts/work-illustrations.mjs` — рисует схемы семи рабочих систем (`dist/assets/inventory/work-*.webp`) в палитре сайта через headless Chrome; `--check` проверяет, что картинки не старше скрипта.
- `video/teaser/` — исходник тизера на [HyperFrames](https://github.com/heygen-com/hyperframes): `npm run check`, `npm run render`; готовый MP4 лежит в `dist/assets/video/`.
- `cloudflare/` — исходники обработчика заявок, тесты и миграции D1.
- `.github/workflows/pages.yml` — проверка кода и публикация только `dist/`.

Семь рабочих систем Sapa Technologies описаны обезличенно: код закрыт, внутренние адреса, имена и данные компании не публикуются. Картинки сертификатов лежат в `dist/assets/inventory/`; изображение сертификата HackAlem — текстовая реконструкция, оригинал в PDF. Демонстрационных заглушек на сайте нет. Резюме лежит в `dist/assets/Nursultan-Nurmukhamet-CV.pdf`. 3D-сцена `dist/scene.js` на главной сейчас не используется, но собирается и проверяется как раньше.

## Локальный просмотр

```sh
node scripts/serve-dist.mjs 4173
```

Открыть http://127.0.0.1:4173/. Готовые файлы уже находятся в `dist/`, для просмотра сборка не нужна. Изображения, шрифты и 3D-код загружаются с самого сайта.

После изменений `src/scene.js` или исходного изображения пересоберите оптимизированные ресурсы. Используются версии esbuild и sharp из зафиксированного lockfile обработчика:

```sh
cd cloudflare
pnpm install --frozen-lockfile
cd ..
node scripts/build-assets.mjs
node scripts/build-assets.mjs --check
node --test cloudflare/worker.test.mjs tests/*.test.mjs
```

Исходный PNG преобразуется в lossless WebP с проверкой всех видимых пикселей и прозрачности; Three.js собирается в один минифицированный модуль с сохранением лицензии. CI проверяет актуальность сгенерированных файлов. Не редактируйте `dist/scene.js` вручную.

## Форма обращения

Форма собирает проблему, желаемый результат, имя, необязательный телефон и Telegram/email. Cloudflare Turnstile проверяется на стороне Worker. Заявка сначала сохраняется в D1; уведомление отправляется получателю, заданному серверной настройкой. «Принята» означает сохранение, а не подтверждение доставки Telegram.

Токены, получатель, секрет Turnstile и соль ограничения запросов хранятся только в Worker secrets. В клиентском коде есть лишь публичные endpoint и sitekey. Локальный `wrangler.jsonc` и файлы окружения исключены из Git; для самостоятельного развёртывания используйте `cloudflare/wrangler.example.jsonc`.

```sh
node --test cloudflare/worker.test.mjs
```

Тесты проверены на Node.js 24 и не отправляют реальные сообщения. Production-проверку Turnstile следует проходить в обычном браузере; автоматические тесты не доказывают реальную доставку.

## Публикация

Изменения в ветке `main` запускают GitHub Actions: проверку JavaScript, тесты обработчика и публикацию `dist/` на Pages. Обработчик Cloudflare развёртывается отдельно; автоматизация Pages не получает его секреты.

В `ALLOWED_ORIGINS` Worker должен быть точный origin сайта, а в Turnstile — его hostname. Нельзя помещать токен Telegram или содержимое заявок в репозиторий, workflow, логи либо JavaScript сайта.

## Сторонние компоненты

Three.js используется по MIT; шрифты Anton и Manrope — по OFL. Тексты лицензий сохранены в `dist/vendor/` и `dist/assets/`.

Пиксельные проценты используют Portfolio Loader Pixel — сокращённую до `0123456789%` производную Press Start 2P (The Press Start 2P Project Authors). Производная переименована в соответствии с Reserved Font Name; лицензия OFL сохранена в `dist/assets/PRESS-START-2P-LICENSE.txt`.
