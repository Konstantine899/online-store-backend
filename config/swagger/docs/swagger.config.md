# Настройка конфигурации swagger

Документация проекта доступна по
адресу [http://localhost:5000/online-store/docs](http://localhost:5000/online-store/docs)

- `config/swagger/swagger.config.ts` - конфиг `swagger`

```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function swaggerConfig(app: INestApplication): void {
  const config = new DocumentBuilder()
	.setTitle('online-store-backend')
	.setDescription('Документация online-store API')
	.addTag('Автор: Атрощенко Константин')
	.setVersion('1.0.0')
	.addBearerAuth(
	  {
		type: 'http',
		scheme: 'bearer',
		bearerFormat: 'JWT',
		name: 'JWT',
		description: 'Enter JWT token',
		in: 'header',
	  },
	  'JWT-auth', // Это имя важно для сопоставления с @ApiBearerAuth() в контроллере!
	)
	.addCookieAuth('authCookie', {
	  type: 'http',
	  in: 'header',
	  scheme: 'bearer',
	})
	.build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/online-store/docs', app, document);
}

```

В параметре функции `swaggerConfig` ожидает `instance application` типа `INestApplication` из пакета `@nestjs/common`.

Далее создаю объект конфигурации с помощью инициализации класса `DocumentBuilder`. `DocumentBuilder` - это `helpers` который
помогает структурировать базовый документ, соответствующий спецификации `OpenAPI`.

Он предоставляет методы:

- `setTitle` - Устанавливаем заголовок. Обычно это название самого проекта
- `setDescription` - Краткое описание `API`
- `addTag` - Можно добавлять разную информацию. Кто автор и т.д.
- `setVersion` - Версия документации
- `addBearerAuth` - устанавливаю `Bearer` `token` для `access` `token`
    1) В type указываю тип используемого протокола `http`
    2) В schema - указываю тип используемого `token bearer(токен носитель)`
    3) В `bearerFormat` - формат используемого токена (`JWT`)
    4) В name - `JWT` сопоставляется с `ApiBearerAuth('JWT-auth')` когда мы описываем `endpoint`
    5) `description` - ...
    6) В `in` - указываю что используется в `headers`.
- `JWT-auth` - Это имя важно для сопоставления с `@ApiBearerAuth()` в контроллере!
- `addCookieAuth` - устанавливаю `cookie`
    1) В `type` указываю тип используемого протокола `http`
    2) В `schema` - указываю тип используемого `token bearer(токен носитель)`
    3) В `in` - указываю что используется в `headers`

В `createDocument` создаю документ. Первым аргументом передаю `instance application`, а вторым аргументом `config` `swagger`.

В `SwaggerModule.setup` первым аргументом передаю `path` по которому будет доступна документация. Вторым аргументом передаю `instance` `application`. А третьим аргументом передаю созданный `document`.

Для описания endpoint в каждом модуле создаю соответствующий декоратор.

---

## Auth модуль

