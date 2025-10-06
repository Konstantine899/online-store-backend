import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { UserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';

export const GetUserAddressSwaggerDecorator = () =>
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
