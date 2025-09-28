import {
    BelongsToMany,
    Column,
    DataType,
    Model,
    Table,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { UserModel } from './user.model';
import { UserRoleModel } from './user-role.model';
import { ApiProperty } from '@nestjs/swagger';
import { Op } from 'sequelize';

interface IRoleModel {
    id: number;
    role: string;
    description: string;
    users: UserModel[];
    createdAt: Date; 
    updatedAt: Date; 
}

interface IRoleCreationAttributes {
    role: string;
    description: string;
}

@Table({
    tableName: 'role',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        // Scope для поиска по роли
        byRole: (role: string) => ({
            where: { role },
        }),
        // Scope для поиска по описанию
        byDescription: (description: string) => ({
            where: { 
                description: {
                    [Op.like]: `%${description}%`,
                },
            },
        }),
        // Scope для загрузки с пользователями
        withUsers: {
            include: [{
                model: UserModel,
                through: { attributes: [] },
                attributes: ['id', 'email', 'name'],
            }],
        },
        // Scope для активных ролей (с пользователями)
        active: {
            include: [{
                model: UserModel,
                through: { attributes: [] },
                attributes: [],
                required: true,
            }],
        },
    },
})
export class RoleModel extends Model<RoleModel, IRoleCreationAttributes> implements IRoleModel {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор роли',
    })
    @Column({
        type: DataType.INTEGER,
        unique: true,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @ApiProperty({
        example: 'USER',
        description: 'Роль',
    })
    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    role!: string;

    @ApiProperty({
        example: 'Пользователь',
        description: 'Описание роли',
    })
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    description!: string;

    // Многие ко многим через промежуточную таблицу UserRoleModel
    @BelongsToMany(() => UserModel, () => UserRoleModel)
    users!: UserModel[];

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'created_at',
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'updated_at',
    })
    declare updatedAt: Date;
}
