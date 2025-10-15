SNP Chrome Extension (MV3)

Парсер карточек недвижимости. Универсальный парсинг (JSON-LD, OpenGraph, meta), реестр доменных парсеров, popup для предпросмотра и копирования JSON.

Установка и запуск

1) Установка зависимостей:

```bash
cd snp-chrome-ext
pnpm i
```

2) Генерация иконок (первый раз):

```bash
# Установите sharp (опционально, для автоматической генерации)
pnpm add -D sharp

# Сгенерируйте PNG иконки из SVG
pnpm generate-icons

# Или используйте онлайн конвертеры (см. public/icons/README.md)
```

3) Сборка:

```bash
pnpm build
```

4) Загрузка в Chrome:

- Откройте chrome://extensions
- Включите режим разработчика
- Загрузите распакованное расширение, указав папку `snp-chrome-ext/dist`

Режим разработки (watch):

```bash
pnpm watch
```

Функции

- Автопарсинг на страницах объявлений (content script)
- Контекстное меню «SNP: Extract listing»
- Popup: предпросмотр JSON, копирование, скачивание
- Реестр парсеров под домены + общий парсер

Структура

- `src/content-script.ts` — извлечение данных на странице
- `src/background.ts` — контекстное меню, коммуникация
- `src/popup/*` — UI предпросмотра
- `src/parsers/*` — общий и доменные парсеры
- `src/utils/*` — JSON-LD, meta, утилиты
