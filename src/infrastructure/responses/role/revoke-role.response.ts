import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для отзыва роли у пользователя
 */
export class RevokeRoleResponse {
    @ApiProperty({
        description: 'Сообщение о результате операции',
        example: 'Роль успешно отозвана у пользователя',
    })
    declare readonly message: string;

    @ApiProperty({
        description: 'ID пользователя',
        example: 123,
    })
    declare readonly userId: number;

    @ApiProperty({
        description: 'ID роли',
        example: 5,
    })
    declare readonly roleId: number;
}

