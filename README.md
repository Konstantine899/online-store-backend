## Запуск проекта

```
npm install - установка необходимых зависимостей
npm run start:dev

```
---

## Скрипты

- `npm run build` - production сборка проекта
- `npm run start` - запуск проекта в production режиме
- `npm run start:dev` - запуск проекта в development режиме
- `npm run lint:ts` - Проверка ts файлов линтером
- `npm run lint:ts:fix` - Исправление ts файлов линтером
- `npm run prettier` - Форматирование файлов линтером
- `npm run db:migrate` - Создание таблиц в БД с помощь миграции
- `npm run db:migrate:undo` - Удаление последней миграции
- `npm run db:migrate:undo:all` - Удаление всех миграций
- `npm run db:seed:all` - Добавление данных в таблицы
- `npm run db:seed:undo:all` - Удаление всех данных из таблиц


---

# конфигурация и подключение к БД

Подробнее о конфигурации и подключение к БД - [конфигурация и подключение к БД](config/sequelize/configuration-and-connection-db.md)