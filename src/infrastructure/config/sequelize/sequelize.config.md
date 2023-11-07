# Sequelize config

```bash
npm i @nestjs/config
```

Подробнее можно ознакомится [nestjs-config
](https://www.npmjs.com/package/nestjs-config)

```bash
npm i @nestjs/sequelize
```

Подробнее можно ознакомится [@nestjs/sequelize](https://www.npmjs.com/package/@nestjs/sequelize)

## db-token

- `dbToken` - токен использующийся для регистрации настроек БД.

```ts
export const dbToken = 'database';

```
<br/>
<br/>
<br/>

## sql.config.ts

```ts
import { registerAs } from '@nestjs/config';
import { Dialect } from 'sequelize';
import { dbToken } from '@app/infrastructure/config/sequelize/db-token';

export const sqlConfig = registerAs(dbToken, () => ({
    dialect: <Dialect>process.env.DIALECT || 'mysql',
    logging: process.env.SQL_LOGGING === 'true',
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    autoLoadModels: true,
    synchronize: true,
}));

```

Конфигурация sqlConfig содержит в себе функцию возвращающую конфигурацию. Callback registerAs Первым аргументом
принимает token. Token называю database.

Все значения для полей конфигурации подтягиваются из переменных окружения.

- `dialect` - диалект базы данных. Что бы правильно указать диалект необходимо воспользоваться generic Dialect, из
  пакета sequelize, после которого добавляем диалект из переменных окружения.
- `logging` - вывод логов в консоль
- `host` - хост на котором будет запущена бд
- `port` - порт
- `username` - имя пользователя
- `password` - пароль
- `database` - название базы данных
- `autoLoadModels` - автоматическая загрузка моделей
- `synchronize` - синхронизация моделей с таблицами в БД



## config.ts

```ts
import { registerAs } from '@nestjs/config';
import { sqlConfig } from './sql.config';
import { dbToken } from '@app/infrastructure/config/sequelize/db-token';

export const databaseConfig = registerAs(dbToken, () => ({
    sql: { ...sqlConfig() },
}));

```

Корневой файл конфигурации - это config.ts.

- `databaseConfig` - первым аргументом в функцию registerAs передаю token. Данная функцию будет возвращать объект
  конфигурации. В поле sql разворачиваю все настройки из sql.config.ts.

## sequelize.config.service

```ts
import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
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
} from '@app/domain/models';
import { dbToken } from '@app/infrastructure/config/sequelize/db-token';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createSequelizeOptions(): SequelizeModuleOptions {
        const {
            sql: { dialect, host, port, username, password, database },
        } = this.configService.get(dbToken);

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

Конфигурационный файл для sequelize. Здесь создаю конфигурационный класс SequelizeConfigService для sequelize. Мы
прокидываем основную конфигурацию для ConfigModule из пакета @nestjs/config. Т.е. SequelizeConfigService прокидываем как
основную конфигурацию для sequelize. С помощью декоратора Injectable указываю что этот класс буду использовать как
provider.

Имплементируют в этот класс interface SequelizeOptionsFactory у которого есть одно единственный метод
createSequelizeOptions.

В constructor передаю переменную которая содержит в себе ConfigService из пакета @nestjs/config.

Далее реализуем метод createSequelizeOptions из SequelizeOptionsFactory. Возвращать этот метод будет
SequelizeModuleOptions из пакета @nestjs/sequelize.
Первым делом получим все необходимые поля из конфигурации БД. Для этого вызываю configService. У него есть метод get
который аргументом принимает токен конфигурации. Де структуризирую все необходимые поля.

Далее из класса SequelizeConfigService возвращаем все поля конфигурации.

Так же необходимо вернуть все модели. Для этого в поле models передаю все необходимые модели.

Так же передаю autoLoadModels для автоматической загрузки моделей, и synchronize для синхронизации моделей с таблицами.

В поле define определяю какого типа символы, и какого типа сопоставления и сортировки будут использоваться в таблицах. 

<br/>
<br/>
<br/>

### app.module.ts

Далее в самом приложении необходимо зарегистрировать SequelizeModule

```ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import * as path from 'path';
import {
    SequelizeConfigService,
    databaseConfig,
} from '@app/infrastructure/config/sequelize';

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

Для регистрации sequelize модуля в приложении у SequelizeModule, из пакета @nestjs/sequelize, вызываю метод forRootAsync с помощью которого мы асинхронно зарегистрировать наш модуль. Аргументом он принимает объект конфигурации. В imports импортирую ConfigModule из пакета @nestjs/config. В useClass передаю настройки конфигурации SequelizeConfigService.

Далее необходимо зарегистрировать корневой конфиг для nestjs. В ConfigModule вызываю метод forRoot, который принимает объект конфигурации. В envFilePath указываю путь до файла переменных окружения. В зависимости в каком режиме мы запускаем проект он может быть разным. В поле load передаю настройки корневого конфига.