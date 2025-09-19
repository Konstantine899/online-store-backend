import { RoleModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class GetListRoleResponse extends RoleModel {
    @ApiProperty({ example: 1, description: 'Идентификатор роли' })
    declare id: number;

    @ApiProperty({ example: 'USER', description: 'Роль' })
    declare role: string;

    @ApiProperty({ example: 'Пользователь', description: 'Описание роли' })
    declare description: string;
}
