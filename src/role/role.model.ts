import {
    BelongsToMany,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from '../user/user.model';
import { UserRoleModel } from './user-role.model';
import { ApiProperty } from '@nestjs/swagger';

@Table({
    tableName: 'role',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class RoleModel extends Model<RoleModel> {
    @ApiProperty({ example: 1, description: 'Идентификатор роли' })
    @Column({
        type: DataType.INTEGER,
        unique: true,
        autoIncrement: true,
        primaryKey: true,
    })
    id: number;

    @ApiProperty({ example: 'USER', description: 'Роль' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    role: string;

    @ApiProperty({ example: 'Пользователь', description: 'Описание роли' })
    @Column({ type: DataType.STRING, allowNull: false })
    description: string;

    // Многие ко многим через промежуточную таблицу UserRoleModel
    @BelongsToMany(() => UserModel, () => UserRoleModel)
    users: UserModel[];
}
