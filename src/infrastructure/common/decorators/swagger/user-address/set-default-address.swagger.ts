import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';

export const SetDefaultUserAddressSwaggerDecorator = () =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({ summary: 'Сделать основным', description: 'Устанавливает адрес основным' }),
        ApiParam({ name: 'id', type: Number, required: true, description: 'ID адреса' }),
        ApiResponse({ status: HttpStatus.OK, description: 'Обновлено', type: UserAddressResponse }),
    );


