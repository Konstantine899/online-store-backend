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

<br/>
<br/>

# Конфигурация проекта

- `config/sequelize` - [настройка конфигурации sequelize и подключения к БД](config/sequelize/configuration-and-connection-db.md)
- `config/swagger` - [настройка конфигурации swagger](config/swagger/docs/swagger.config.md)
- `config/jwt` - [настройка конфигурации jwt](config/jwt/jwt.config.md)

Подробнее о конфигурации `nestjs` можно почитать в
документации - [Configuration](https://docs-nestjs.netlify.app/techniques/configuration)

Подробнее о конфигурации `sequelize-typescript` можно почитать в
документации - [Configuration](https://github.com/sequelize/sequelize-typescript#configuration)

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

## Pipes

- Подробнее о `custom pipes` использующихся в проекте, можно ознакомиться здесь - [pipes](./pipes/pipes.md)

Подробнее о `pipes` можно почитать в документации - [pipes](https://docs.nestjs.com/pipes)

---

<br/>
<br/>

## Exceptions

- Подробнее о `custom exceptions` использующихся в проекте, можно ознакомиться здесь - [exceptions](./exceptions/exceptions.md)

Подробнее о `exceptions` можно почитать в документации - [exception-filters](https://docs.nestjs.com/exception-filters)

---

<br/>
<br/>

## Модули

- Подробнее о модуле `auth` - [module auth](./src/auth/auth.md)
- Подробнее о модуле `brand` - [module brand](./src/brand/brand.md)
- Подробнее о модуле `cart` - [module cart](./src/cart/cart.md)
- Подробнее о модуле `category` - [module category](./src/category/category.md)
- Подробнее о модуле `file` - [module file](./src/file/file.md)
- Подробнее о модуле `order` - [module order](./src/order/order.md)
- Подробнее о модуле `order-item` - [module order-item](./src/order-item/order-item.md)
- Подробнее о модуле `payment` - [module payment](./src/payment/payment.md)
- Подробнее о модуле `product` - [module product](./src/product/product.md)
- Подробнее о модуле `product-property` - [module product-property](./src/product-property/product-property.md)
- Подробнее о модуле `rating` - [module rating](./src/rating/rating.md)
- Подробнее о модуле `role` - [module role](./src/role/role.md)
- Подробнее о модуле `token` - [module token](./src/token/token.md)
- Подробнее о модуле `user` - [module user](./src/user/user.md)