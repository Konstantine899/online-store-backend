## Запуск проекта

```
npm install - установка необходимых зависимостей
npm run start:dev

```

---

<br/>
<br/>

## Скрипты

- `npm run build` - production сборка проекта
- `npm run start` - запуск проекта в `production` режиме
- `npm run start:dev` - запуск проекта в development режиме
- `npm run lint:ts` - Проверка ts файлов линтером
- `npm run lint:ts:fix` - Исправление `ts` файлов линтером
- `npm run prettier` - Форматирование файлов линтером
- `npm run db:migrate` - Создание таблиц в БД с помощь миграции
- `npm run db:migrate:undo` - Удаление последней миграции
- `npm run db:migrate:undo:all` - Удаление всех миграций
- `npm run db:seed:all` - Добавление данных в таблицы
- `npm run db:seed:undo:all` - Удаление всех данных из таблиц

---

<br/>
<br/>

## Миграции

- `db/config` - содержит файл конфигурации, который сообщает `sequelize CLI`, как подключаться к базе данных
- `db/config/migrations` - содержит все файлы миграций. В названии файлов миграций содержится `hash`.
  Пример: `20230602150332-create-user.js`. `Hash` - это время создания в `unix` формате.

~~~
Важно! При создании таблицы, автоматически создается ассоциация(и). таким образом если таблица на которую ссылается ассоциация еще не создана, то возникнет ошибка.
~~~

- `db/models` - содержит все модели проекта.
- `db/seeders` - файлы которые содержат все исходные данные для добавления в таблицы.
- `.sequelizerc` - Это специальный файл конфигурации в котором прописаны настройки для `sequelize CLI`. Подробнее можно
  ознакомится в документации [.sequelizerc](https://sequelize.org/docs/v6/other-topics/migrations/#the-sequelizerc-file)

Подробнее о миграциях можно почитать в
документации - [Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)


---

<br/>
<br/>

## Слой domain

- `domain/controllers` - `interfaces` описывающие методы контроллеров
- `domain/dto` - `interfaces` описывающие структуры входящих данные `Data Transfer Object`
- `domain/headers` - `interface` описывающий заголовки
- `domain/jwt` - `interfaces` `jwt` `token`.
- `domain/models` - `interfaces` и `sequelize` `models` описывающие структуры данных таблиц в БД.
- `domain/paginate` - `interfaces` необходимые для пагинации.
- `domain/pipes` - `interfaces` необходимые для преобразования или валидации входящих данных.
- `domain/repositories` - `interfaces` описывающие методы в `repositories`
- `domain/request` - `interfaces` описывающие данные входящие в запрос.
- `domain/responses` - `interfaces` описывающие возвращаемые ответы функций и методов.
- `domain/services` - `interfaces` описывающие методы `services`
- `domain/transform` - `interfaces` - описывающие преобразование данных
