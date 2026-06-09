# ИНТЕХ-АТОМ — справочник ПНАЭ

Платформа инженерных расчётов на прочность: калькуляторы, методики (.docx → HTML), справочники и админ-панель.

## Стек

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4, Radix UI (shadcn-стиль)
- **Backend**: Node.js, Express 5, PostgreSQL, mammoth.js, JWT
- **Формулы**: KaTeX

## Быстрый старт

### 1. PostgreSQL

```bash
docker compose up -d
```

### 2. Переменные окружения

Скопируйте `.env.example` в `.env` в корне репозитория.

### 3. Установка и миграции

Рекомендуется **Node.js 22 LTS** (на Windows с путём без кириллицы, например `C:\dev\intech-atom`).

```bash
npm install
npm run db:migrate
npm run db:seed-calculators
```

### Обновление справочника сталей из Excel

Положите файл `ПНАЭ физмех свойства.xlsx` в `data/pnae-steel-properties.xlsx` (или обновите копию с Яндекс.Диска) и выполните:

```bash
# распаковка не нужна — скрипт читает листы из xlsx-unzip после копирования в data/
copy data\pnae-steel-properties.xlsx data\pnae.zip
Expand-Archive data\pnae.zip data\xlsx-unzip -Force
npm run data:extract-steel
```

Если `npm install` падает с `ECONNRESET`, `EBUSY` или `esbuild`:

1. Закройте все терминалы с `npm run dev` и вкладки Cursor, где запущен проект.
2. Выполните чистую установку:

```powershell
npm run clean:install
```

Или по шагам:

```powershell
npm run install:api
npm run install:web
npm install
```

### 4. Запуск

В **двух** терминалах:

```bash
npm run dev:api
npm run dev:web
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

**Админ по умолчанию:** `admin@intech-atom.local` / `admin123`

## Структура

```
intech-atom/
├── apps/
│   ├── api/          # Express API
│   └── web/          # React SPA
├── docker-compose.yml
└── package.json      # npm workspaces
```

## Реализовано (MVP)

- [x] Монорепо frontend + backend
- [x] Layout: sticky header, sidebar, breadcrumbs, тёмная/светлая тема
- [x] Глобальный поиск (Ctrl+K)
- [x] Методики: загрузка .docx, mammoth → HTML, оглавление, скачивание
- [x] Админ `/admin` — публикация методик
- [x] Калькуляторы ИН № 1 (допускаемые напряжения) и ИН № 2 (прибавка к толщине)
- [x] Справочник сталей ПНАЭ из Excel (357 марок: Rm, Rp0,2, A, Z, α, E по температуре)
- [x] История расчётов в localStorage
- [x] Печать отчёта (PDF через браузер)

## Устранение неполадок (Windows)

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `ECONNRESET` | Сеть / VPN / прокси | Повторить установку; проверить VPN; `npm config get proxy` |
| `EBUSY` / `EPERM` на `esbuild` | Файл занят (IDE, антивирус) | Закрыть dev-серверы; `npm run clean:install`; исключить папку в Defender |
| Путь `Прога` в Desktop | Кириллица ломает native-модули | Скопировать проект в `C:\dev\intech-atom` |
| `Cannot find module tsx` | Обрыв установки | `npm run install:api` затем `npm run db:migrate` (миграция уже без tsx) |
| Node 24.x | Ранняя версия | Установить [Node 22 LTS](https://nodejs.org/) |

## Дальнейшее развитие

Справочники в БД, остальные калькуляторы, закладки, S3 для файлов, PDF-генерация на сервере, комментарии к методикам.
