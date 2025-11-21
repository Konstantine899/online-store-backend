import { ApiProperty } from '@nestjs/swagger';

/**
 * Response для отзыва разрешения у роли
 */
export class RevokePermissionResponse {
    @ApiProperty({
        description: 'Сообщение о результате операции',
        example: 'Разрешение успешно отозвано у роли',
    })
    declare readonly message: string;

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
        example: 'delete',
    })
    declare readonly action: string;
}

