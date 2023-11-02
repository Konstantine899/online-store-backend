import { RoleModel } from '../../../domain/models/role.model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleResponse extends RoleModel {
    @ApiProperty({ example: 1, description: 'Идентификатор роли' })
    id: number;

    @ApiProperty({ example: 'USER', description: 'Роль' })
    role: string;

    @ApiProperty({ example: 'Пользователь', description: 'Описание роли' })
    description: string;
}