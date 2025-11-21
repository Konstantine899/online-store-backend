import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для назначения роли пользователю
 */
export class AssignRoleResponse {
    @ApiProperty({
        description: 'Сообщение о результате операции',
        example: 'Роль успешно назначена пользователю',
    })
    declare readonly message: string;

    @ApiProperty({
        description: 'ID созданной записи user_role',
        example: 42,
    })
    declare readonly userRoleId: number;

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

    @ApiProperty({
        description: 'ID тенанта',
        example: 1,
        required: false,
    })
    declare readonly tenantId?: number;
}
