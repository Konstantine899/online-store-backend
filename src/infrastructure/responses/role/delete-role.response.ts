import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для удаления роли
 */
export class DeleteRoleResponse {
    @ApiProperty({
        description: 'Сообщение о результате операции',
        example: 'Роль успешно удалена',
    })
    declare readonly message: string;

    @ApiProperty({
        description: 'ID удалённой роли',
        example: 5,
    })
    declare readonly id: number;

    @ApiProperty({
        description: 'Название удалённой роли',
        example: 'TENANT_MANAGER',
    })
    declare readonly role: string;
}

