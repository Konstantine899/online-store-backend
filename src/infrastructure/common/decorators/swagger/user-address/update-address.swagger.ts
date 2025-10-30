import { UpdateUserAddressDto } from '@app/infrastructure/dto';
import { UserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export const UpdateUserAddressSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({
            summary: 'Обновить адрес',
            description: 'Обновляет адрес по id',
        }),
        ApiParam({
            name: 'id',
            type: Number,
            required: true,
            description: 'ID адреса',
        }),
        ApiBody({ type: UpdateUserAddressDto }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Обновлено',
            type: UserAddressResponse,
        }),
    );
