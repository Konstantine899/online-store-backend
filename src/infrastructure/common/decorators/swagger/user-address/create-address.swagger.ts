import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserAddressDto } from '@app/infrastructure/dto';
import { UserAddressResponse } from '@app/infrastructure/responses/user-address/user-address.response';

export const CreateUserAddressSwaggerDecorator = () =>
    applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiOperation({ summary: 'Создать адрес', description: 'Создаёт новый адрес' }),
        ApiBody({ type: CreateUserAddressDto }),
        ApiResponse({ status: HttpStatus.CREATED, description: 'Создано', type: UserAddressResponse }),
    );


