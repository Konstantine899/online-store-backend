import { ApiProperty } from '@nestjs/swagger';

interface IUserRequest {
    id: number;
}

export class UserRequest implements IUserRequest {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    id: number;
}
