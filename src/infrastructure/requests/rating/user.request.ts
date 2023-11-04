import { ApiProperty } from '@nestjs/swagger';
import { IUserRequest } from '@app/domain/requests';

export class UserRequest implements IUserRequest {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    id: number;
}
