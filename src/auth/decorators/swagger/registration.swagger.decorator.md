## registration.swagger.decorator.ts

```ts
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistrationDto } from '../../dto/registration.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { RegistrationResponse } from '../../responses/registration.response';

export function RegistrationSwaggerDecorator() {
    return applyDecorators(
        ApiOperation({ summary: 'Регистрация' }),
        ApiBody({
            type: RegistrationDto,
            description:
                'Структура входных данных для регистрации пользователя',
        }),
        ApiResponse({
            description: 'Created',
            status: HttpStatus.CREATED,
            type: RegistrationResponse,
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            status: HttpStatus.BAD_REQUEST,
            schema: {
                title: 'Электронная почта найдена в БД',
                description: 'Электронная почта должна быть уникальной',
                example: {
                    status: HttpStatus.BAD_REQUEST,
                    message:
                        'Пользователь с таким email: test@gmail.com уже существует',
                },
            },
        }),
    );
}

```

