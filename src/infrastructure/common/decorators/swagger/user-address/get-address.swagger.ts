import { UserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export const GetUserAddressSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({
            summary: 'Получить адрес',
            description: 'Возвращает адрес по id',
        }),
        ApiParam({
            name: 'id',
            type: Number,
            required: true,
            description: 'ID адреса',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Успех',
            type: UserAddressResponse,
        }),
    );
