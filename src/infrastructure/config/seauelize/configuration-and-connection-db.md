## Конфигурация SQL(sql.config.ts)

```ts
import { registerAs } from '@nestjs/config';
import { Dialect } from 'sequelize';
import * as process from 'process';

export const sqlConfig = registerAs('online-store', () => ({
  dialect: <Dialect>process.env.DIALECT || 'mysql',
  logging: process.env.SQL_LOGGING === 'true' ? true : false,
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  autoLoadModels: true,
  synchronize: true,
}));

```

Первый аргумент функции `registerAs` это `token`. Второй аргумент `callback` возвращающий объект полей конфигурации `sql`.

- `autoLoadModels` - автоматическая загрузка моделей.
- `synchronize` - синхронизация моделей

Переменные конфигурации подтягиваются из двух файлов, в зависимости от режима запуска, `.development.env` и `.production.env`.

Особенности полей конфигурации:

1) В поле `dialect` для правильного указания диалекта БД необходимо использовать `generic` в который передаем `Dialect` импортированный из `sequelize`.
2) Поле `port` в обязательном порядке нужно преобразовать в число
3) Поле `logging` является опциональным. С помощью его мы можем управлять выводом логов, выводить `sql` запрос который отработал и т.д.

---

<br/>
<br/>
<br/>

## Конфигурация БД(config.ts)

```ts
import { registerAs } from '@nestjs/config';
import { sqlConfig } from './sql.config';

export const databaseConfig = registerAs('online-store', () => ({
    sql: { ...sqlConfig() },
}));

```

Для того что бы было удобно масштабировать конфигурацию БД в `config.ts`
создаю еще одну конфигурацию `databaseConfig`. Так же в `registerAs` первым аргументом передаю token а вторым `callback` возвращающий объект конфигурации БД. В поле `sql` просто проксирую настройки из `sql.config.ts`.

---

<br/>
<br/>
<br/>

## Конфигурация Sequelize(sequelize.config.service.ts)

```ts
import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductModel } from '../../src/product/product.model';
import { CategoryModel } from '../../src/category/category-model';
import { BrandModel } from '../../src/brand/brand.model';
import { ProductPropertyModel } from '../../src/product-property/product-property.model';
import { UserModel } from '../../src/user/user.model';
import { RoleModel } from '../../src/role/role.model';
import { UserRoleModel } from '../../src/role/user-role.model';
import { RefreshTokenModel } from '../../src/token/refresh-token.model';
import { CartModel } from '../../src/cart/cart.model';
import { CartProductModel } from '../../src/cart/cart-product.model';
import { RatingModel } from '../../src/rating/rating.model';
import { OrderModel } from '../../src/order/order.model';
import { OrderItemModel } from '../../src/order-item/order-item.model';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createSequelizeOptions(): SequelizeModuleOptions {
        const {
            sql: { dialect, host, port, username, password, database },
        } = this.configService.get('online-store');

        return {
            dialect,
            host,
            port,
            username,
            password,
            database,
            models: [
                ProductModel,
                CategoryModel,
                BrandModel,
                ProductPropertyModel,
                UserModel,
                RoleModel,
                UserRoleModel,
                RefreshTokenModel,
                CartModel,
                CartProductModel,
                RatingModel,
                OrderModel,
                OrderItemModel,
            ],
            autoLoadModels: true,
            synchronize: true,

            define: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_0900_ai_ci',
            },
        };
    }
}

```

С помощью декоратора `Injectable` внедряю класс `SequelizeConfigService` который имплементирует все зависимости от `SequelizeOptionsFactory`.

В `construct` создаю приватную переменную типа, которая будет использоваться только для чтения, `configService` типа `ConfigService`. Тип `ConfigService` нужно импортировать из пакета `@nestjs/config`.

```bash
npm i @nestjs/config
```

Далее реализовываю метод `createSequelizeOptions` из пакета `SequelizeOptionsFactory`. Возвращать этот метод будет объект типа `SequelizeModuleOptions`.

Первым делом из нашей конфигурации БД получим все поля. Для этого обращаюсь к `configService` и вызываю метод `get`. В метод `get` передаю `token` который, хочу отловить - это название нашей БД. Далее из поля `sql` деструктуризирую все необходимы поля для подключения к БД.

Из класса возвращаю все для подключения. В поле `models` передаю все необходимые модели для генерации таблиц в БД. И так же добавляю поле `autoLoadModels` для автоматической загрузки моделей. И поле `synchronize` для синхронизации моделей.

Поле `define` инициализирую объектом с полями `charset` и `collete`. В `charset` указываю какие символы мы используем. В `collete` указываю параметры сортировки БД или столбцов. Подробнее [COLLATE (Transact-SQL)](https://learn.microsoft.com/ru-ru/sql/t-sql/statements/collations?view=sql-server-ver16).

---

<br/>
<br/>
<br/>

## app.module.ts регистрация SequelizeModule

Далее регистрируем `SequelizeModule` в корневом файле приложения.

```ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import { SequelizeConfigService } from '../config/sequelize/sequelize.config.service';
import { databaseConfig } from '../config/sequelize/config';

@Module({
  imports: [
	SequelizeModule.forRootAsync({
	  imports: [ConfigModule],
	  useClass: SequelizeConfigService,
	}),
	ConfigModule.forRoot({
	  envFilePath: `.${process.env.NODE_ENV}.env`,
	  load: [databaseConfig],
	}),
  ],
})
export class AppModule {}

```

У `SequelizeModule` вызываю метод `forRootAsync` для асинхронного подключения к БД. В объект конфигурации так же передаем `imports`. Указываю что импортирую `ConfigModule` из пакета `@nestjs/config`, где зарегистрирован наш конфиг под названием `data-base`. Настройки мы передаем в `useClass: SequelizeConfigService`.

<br/>
<br/>
<br/>

## app.module.ts регистрация databaseConfig

Далее нужно зарегистрировать конфигурационный модуль подключения к БД.
Для этого у `ConfigModule`, из пакета `@nestjs/config`, вызываю синхронный метод `forRoot` и передаю в него объект с настройками. В `envFilePath` передаю путь до переменных окружения, а в `load` передаю конфигурационный файл БД `databaseConfig`.




