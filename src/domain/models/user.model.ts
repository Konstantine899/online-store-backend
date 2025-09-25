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
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
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
        type: DataType.STRING,
        unique: true,
    })
   declare email: string;

    @Column({ type: DataType.STRING })
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
