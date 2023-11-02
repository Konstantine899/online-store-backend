import { ApiProperty } from '@nestjs/swagger';
import { IUserRequest } from '../../../domain/requests/rating/i-user-request';

export class UserRequest implements IUserRequest {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    id: number;
}
