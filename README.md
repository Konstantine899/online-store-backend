## Просто делай коммит до обновления проекта


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

### Swagger

Swagger - доступен по [http://localhost:5000/online-store/docs](http://localhost:5000/online-store/docs)

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

<br/>
<br/>
<br/>

## Слой infrastructure

- `infrastructure/common` - директория в которой используются функции `decorators`, `guards`, `strategies`. Они
  взаимодействуют со всем приложением.
- `infrastructure/common/decorators` - общие декораторы для всего проекта, например: `roles-auth.decorator.ts`, декоратор
  проверяющий роли пользователя в `endpoints`. Для более подробного ознакомления
  перейдите [decorators.md](src/infrastructure/common/decorators/decorators.md)
- `infrastructure/common/decorators/swagger` - декораторы с помощью которых задокументированы `endpoints`. Для более
  подробного ознакомления использующихся в проекте `swagger` `decorators`
  перейдите [swagger.decorators.md](src/infrastructure/common/decorators/swagger/swagger.decorators.md)
- `infrastructure/common/guards` - защитники, например: `auth.guard.ts` - проверяет авторизацию пользователя,
  `role.guard.ts` - проверяет роль пользователя. Для более подробного ознакомления использующихся в проекте `guards`
  перейдите [guards.md](src/infrastructure/common/guards/guards.md) или
  документацию [guards](https://docs.nestjs.com/websockets/guards#binding-guards)
- `infrastructure/common/strategies` - стратегии использующиеся для аутентификации и авторизации пользователя в
  приложении. Например: `JwtStrategy`, `GoogleStrategy`, `GithubStrategy` и т.д. Для более подробного ознакомления
  использующихся в проекте `strategies`
  перейдите [strategies.md](src/infrastructure/common/strategies/strategies.md) или
  документацию [Passport (authentication)](https://docs.nestjs.com/recipes/passport#implementing-passport-strategies).

<br/>
<br/>

- `infrastructure/config` - в этой директории содержится конфигурация библиотек и фраемворков. Более подробно об
  конфигурациях использующихся в проекте можно
  почитать [jwt.config.md](src/infrastructure/config/jwt/jwt.config.md), [multer.config.md](src/infrastructure/config/multer/multer.config.md), [sequelize.config.md](src/infrastructure/config/sequelize), [swagger.config.md](src/infrastructure/config/swagger/swagger.config.md)
- `infrastructure/controllers` - в этой директории бизнес логика контроллеров. Более подробно можно
  ознакомится [controllers.md](src/infrastructure/controllers/controllers.md)
- `infrastructure/dto` - в этой директории содержится структура входящих данных. Более подробно можно
  ознакомится [dto.md](src/infrastructure/dto/dto.md)
- `infrastructure/exceptions` - в этой директории содержутся исключения с помощью которых выводим частичную или более
  подробную информацию об ошибке. Для более подробного ознакомления о `custom` `exceptions` использующихся в проекте
  ознакомьтесь [exceptions.md](src/infrastructure/exceptions/exceptions.md). Для более подробного ознакомления
  перейдите в документацию [exceptions](https://docs.nestjs.com/exception-filters#throwing-standard-exceptions)
- `infrastructure/paginate` - методы требующиеся для постраничного вывода. Более подробно можно
  ознакомится [paginate.md](src/infrastructure/paginate/paginate.md)
- `infrastructure/pipes` - в этой директории содержаться классы с помощью которых мы можем преобразовывать входящие
  данные в желаемый формат, или осуществлять валидацию входящих данных. Более подробно, об использующихся custom pipes в
  проекте можно ознакомится [pipes](src/infrastructure/pipes/pipes.md). Для более подробной информации можно
  ознакомится с документацией [pipes](https://docs.nestjs.com/pipes).
- `infrastructure/repositories` - в этой директории бизнес логика репозиториев. Более подробно можно
  ознакомится [repositories.md](src/infrastructure/repositories/repositories.md)
- `infrastructure/requests` - запросы. Более подробно можно
  ознакомится [requests.md](src/infrastructure/requests/requests.md)
- `infrastructure/responses` - ответы возвращаемые функциями и методами. Более подробно можно
  ознакомится [responses.md](src/infrastructure/responses/responses.md)
- `infrastructure/services` - в этой директории бизнес логика сервисов. Более подробно можно
  ознакомится [services.md](src/infrastructure/services/services.md)

