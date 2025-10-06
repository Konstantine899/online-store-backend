import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveUserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';

export const RemoveUserAddressSwaggerDecorator = () =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({
            summary: 'Удалить адрес',
            description: 'Удаляет адрес по id',
        }),
        ApiParam({
            name: 'id',
            type: Number,
            required: true,
            description: 'ID адреса',
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Удалено',
            type: RemoveUserAddressResponse,
        }),
    );
