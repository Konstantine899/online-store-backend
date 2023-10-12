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

# Конфигурация проекта

- `config/sequelize` - [настройка конфигурации sequelize и подключения к БД](config/sequelize/configuration-and-connection-db.md)
- `config/swagger` - [настройка конфигурации swagger](config/swagger/swagger.config.md)
- `config/jwt` - [настройка конфигурации jwt](config/jwt/jwt.config.md)

Подробнее о конфигурации `nestjs` можно почитать в документации - [Configuration](https://docs-nestjs.netlify.app/techniques/configuration)

Подробнее о конфигурации `sequelize-typescript` можно почитать в документации - [Configuration](https://github.com/sequelize/sequelize-typescript#configuration)

---

## Миграции

- `db/config` - содержит файл конфигурации, который сообщает `sequelize CLI`, как подключаться к базе данных
- `db/config/migrations` - содержит все файлы миграций. В названии файлов миграций содержится `hash`. Пример: `20230602150332-create-user.js`. `Hash` - это время создания в `unix` формате.

~~~
Важно! При создании таблицы, автоматически создается ассоциация(и). таким образом если таблица на которую ссылается ассоциация еще не создана, то возникнет ошибка.
~~~

- `models` - содержит все модели проекта.
- `seeders` - файлы которые содержат все исходные данные для добавления в таблицы.
- `.sequelizerc` - Это специальный файл конфигурации в котором прописаны настройки для `sequelize CLI`. Подробнее можно ознакомится в документации [.sequelizerc](https://sequelize.org/docs/v6/other-topics/migrations/#the-sequelizerc-file)

Подробнее о миграциях можно почитать в документации - [Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)