import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для назначения разрешения роли
 */
export class AssignPermissionResponse {
    @ApiProperty({
        description: 'Сообщение о результате операции',
        example: 'Разрешение успешно назначено роли',
    })
    declare readonly message: string;

    @ApiProperty({
        description: 'ID созданной записи role_permission',
        example: 15,
    })
    declare readonly permissionId: number;

    @ApiProperty({
        description: 'ID роли',
        example: 5,
    })
    declare readonly roleId: number;

    @ApiProperty({
        description: 'Ресурс',
        example: 'products',
    })
    declare readonly resource: string;

    @ApiProperty({
        description: 'Действие',
        example: 'create',
    })
    declare readonly action: string;
}

