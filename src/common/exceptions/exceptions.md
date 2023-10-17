## Exceptions

- `CustomNotFoundExceptionFilter` - используется для более подробного вывода информации ошибки `"Not Found"`. Включает
  поля
    * `statusCode` - статус код ошибки
    * `url` - адрес по которому произошла ошибка
    * `path` - endpoint в котором произошла ошибка
    * `name` - имя события которое произошло `NotFoundException`
    * `message` - Сообщение информирующее пользователя

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(NotFoundException)
export class CustomNotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
	const context = host.switchToHttp();
	const {
	  url,
	  path
	} = context.getRequest<Request>();
	const response = context.getResponse<Response>();
	const statusCode = exception.getStatus();
	const {
	  message,
	  name
	} = exception;

	response.status(statusCode).json({
	  statusCode: statusCode,
	  url: url,
	  path: path,
	  name: name,
	  message: message,
	});
  }
}

```

Чуть подробнее. При создании `exception filters` мы действуем по одному и тому же алгоритму. Создаем класс который `implements(реализуется)` от `interface` `ExceptionFilter` библиотеки `@nestjs/common`.

Важный момент! Перед реализацией класса в декораторе `@Catch` передаю тип exception. Декоратор `@Catch` будет отлавливать этот `exception`. После чего мы сможем отловленный exception использовать в нашем коде.

`interface` `ExceptionFilter` в себе реализует один единственный метод `catch`. Метод `catch` принимает два аргумента. Первый это `exception: T`, как `generic` передаем тип обрабатываемого `exception`, к примеру `NotFoundException`. Второй аргумент это `host: ArgumentsHost` из которого мы можем получить `context` запроса.

Далее использую этот контекст запроса. Вытаскиваю интересующие поля и формирую новый ответ.

- `SequelizeDatabaseErrorExceptionFilter` - Используется для вывода информации об ошибке(ах) которая произошла в БД.
    * `url` - адрес по которому произошла ошибка
    * `path` - endpoint в котором произошла ошибка
    * `type` - тип произошедшей ошибки
    * `name` - имя события которое произошло
    * `timestamp` - дата когда произошла ошибка

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseError } from 'sequelize';
import { Request, Response } from 'express';

@Catch(DatabaseError)
export class SequelizeDatabaseErrorExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseError, host: ArgumentsHost) {
	const context = host.switchToHttp();
	const response = context.getResponse<Response>();
	const {
	  url,
	  path
	} = context.getRequest<Request>();
	const {
	  name,
	  message
	} = exception;

	const errorResponse = {
	  url: url,
	  path: path,
	  type: message,
	  name: name,
	  timestamp: new Date().toISOString(),
	};

	response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}

```

- `SequelizeUniqueConstraintExceptionFilter` - ошибка валидации или ограничения в `Sequelize`. Подробнее читайте в
  документации:[Validations & Constraints](https://sequelize.org/docs/v6/core-concepts/validations-and-constraints/#:~:text=Version%3A%20v6%20%2D%20stable-,Validations%20%26%20Constraints,-In%20this%20tutorial)
    * `url` - адрес по которому произошла ошибка
    * `path` - endpoint в котором произошла ошибка
    * `type` - тип произошедшей ошибки
    * `name` - имя события которое произошло
    * `fields` - поля БД в которых произошла ошибка
    * `timestamp` - дата когда произошла ошибка

```ts
import { UniqueConstraintError } from 'sequelize';
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UniqueConstraintError)
export class SequelizeUniqueConstraintExceptionFilter
    implements ExceptionFilter
{
    catch(exception: UniqueConstraintError, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();
        const request = context.getRequest<Request>();
        const { url, path } = request;
        const { name, message, fields } = exception;
        const errorResponse = {
            url: url,
            path: path,
            type: message,
            name: name,
            fields: fields,
            timestamp: new Date().toISOString(),
        };

        response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
    }
}

```

Подробнее об exception filters подробнее можно почитать в документации - [exception filters](https://docs.nestjs.com/exception-filters)
