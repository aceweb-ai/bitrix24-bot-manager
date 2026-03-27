# Bitrix24 Bot Manager

Next.js приложение для управления ботами в Bitrix24.

## Структура

- `pages/` – страницы Next.js
- `pages/api/[...path].js` – прокси к REST API Bitrix24
- `pages/index.js` – главная страница админки
- `pages/_app.js` – опционально, настройка приложения
- `public/` – статические файлы
- `package.json` – зависимости
- `vercel.json` – конфигурация для Vercel (опционально)

## Установка

```bash
npm install
npm run dev
```

## Использование

Настройте переменные окружения для подключения к Bitrix24.
