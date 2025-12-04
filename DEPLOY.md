# Инструкция по деплою на альтернативные хостинги

## Вариант 1: Render (Рекомендуется - бесплатный план)

1. Зарегистрируйся на [render.com](https://render.com)
2. Создай новый Web Service
3. Подключи GitHub репозиторий
4. Настройки:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Environment**: `Node`
5. Добавь переменную окружения:
   - `GOOGLE_API_KEY` = твой ключ (или `ключ1,ключ2,ключ3` через запятую)
6. Нажми "Create Web Service"
7. После деплоя получишь URL типа: `https://koverator-api.onrender.com`
8. Обнови `services/gemini.ts` - замени `/api/generate` на `https://твой-url.onrender.com/api/generate`

**Лимиты Render Free:**
- 750 часов/месяц бесплатно
- Автоматический sleep после 15 минут бездействия
- Таймаут: 60 секунд

## Вариант 2: Fly.io (Быстрый, бесплатный план)

1. Установи Fly CLI: `npm install -g @fly/cli`
2. Зарегистрируйся: `fly auth signup`
3. Деплой: `fly launch` (используй существующий `fly.toml`)
4. Добавь переменную: `fly secrets set GOOGLE_API_KEY=твой-ключ`
5. Получи URL: `fly info` покажет твой домен
6. Обнови `services/gemini.ts` с новым URL

**Лимиты Fly.io Free:**
- 3 shared-cpu-1x VMs
- 256MB RAM на VM
- Таймаут: 60 секунд

## Вариант 3: Amvera (Российский хостинг)

1. Зарегистрируйся на [amvera.ru](https://amvera.ru)
2. Создай новый проект
3. Подключи GitHub репозиторий
4. Выбери тип: Node.js
5. Настройки:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
6. Добавь переменную окружения `GOOGLE_API_KEY`
7. Деплой автоматический после push в GitHub
8. Обнови `services/gemini.ts` с новым URL

## Вариант 4: Yandex Cloud Functions (Российский)

1. Зарегистрируйся на [cloud.yandex.ru](https://cloud.yandex.ru)
2. Создай Function в Yandex Cloud Functions
3. Используй код из `api/generate.js` (адаптируй под формат Yandex)
4. Добавь переменную окружения `GOOGLE_API_KEY`
5. Получи URL функции
6. Обнови `services/gemini.ts`

## После деплоя

1. Обнови `services/gemini.ts`:
```typescript
const response = await fetch('https://твой-новый-url.com/api/generate', {
  // ...
});
```

2. Пересобери фронтенд на Vercel:
```bash
npm run build
git add .
git commit -m "Update API endpoint"
git push
```

3. Vercel автоматически задеплоит обновленный фронтенд

## Проверка работы

После деплоя проверь:
- `https://твой-url.com/health` - должен вернуть `{"status":"ok"}`
- `https://твой-url.com/api/generate` - должен принимать POST запросы

