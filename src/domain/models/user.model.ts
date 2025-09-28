import {
    BelongsToMany,
    Column,
    DataType,
    HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserRoleModel } from './user-role.model';
import { RoleModel } from './role.model';
import { RefreshTokenModel } from './refresh-token.model';
import { RatingModel } from './rating.model';
import { ProductModel } from './product.model';
import { OrderModel } from './order.model';

interface IUserCreationAttributes {
    email: string;
    password: string;
}

interface IUserModel {
    id: number;
    email: string;
    password: string;
    roles: RoleModel[];
    refresh_tokens: RefreshTokenModel[];
    products: ProductModel[];
    orders: OrderModel[];
}

@Table({
    tableName: 'user',
    underscored: true,
    defaultScope: {
        attributes: { 
            exclude: ['updatedAt', 'createdAt', 'password'] // Исключаем пароль по умолчанию
        },
    },
    // ДОБАВЛЕНО: Scopes для разных сценариев использования
    scopes: {
        // Scope для аутентификации - только необходимые поля
        forAuth: {
            attributes: ['id', 'email'],
            include: [{
                model: RoleModel,
                attributes: ['id', 'name'],
                through: { attributes: [] } // Исключаем промежуточную таблицу
            }]
        },
        // Scope для загрузки пользователя с ролями
        withRoles: {
            include: [{
                model: RoleModel,
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }]
        },
    }
})
export class UserModel
    extends Model<UserModel, IUserCreationAttributes>
    implements IUserModel
{
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true, 
            len: [5, 255] 
        }
    })
   declare email: string;

    @Column({ type: DataType.STRING(255), 
        allowNull: false,
        validate: {
            len: [6, 255] 
        }
     })
    declare password: string;

    // Многие ко многим через промежуточную таблицу UserRoleModel
    @BelongsToMany(() => RoleModel, () => UserRoleModel)
    declare roles: RoleModel[];

    //У одного пользователя могут быть несколько refresh tokens

    @HasMany(() => RefreshTokenModel, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
   declare refresh_tokens: RefreshTokenModel[];

    @BelongsToMany(() => ProductModel, {
        through: () => RatingModel,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
   declare products: ProductModel[];

    @HasMany(() => OrderModel, { onDelete: 'SET NULL' })
   declare orders: OrderModel[];
}
