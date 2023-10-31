import {
    BelongsToMany,
    Column,
    DataType,
    HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserRoleModel } from '../role/user-role.model';
import { RoleModel } from '../role/role.model';
import { RefreshTokenModel } from '../token/refresh-token.model';
import { RatingModel } from '../../domain/models/rating.model';
import { ProductModel } from '../../domain/models/product.model';
import { OrderModel } from '../../domain/models/order.model';

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
    id: number;

    @Column({
        type: DataType.STRING,
        unique: true,
    })
    email: string;

    @Column({ type: DataType.STRING })
    password: string;

    // Многие ко многим через промежуточную таблицу UserRoleModel
    @BelongsToMany(() => RoleModel, () => UserRoleModel)
    roles: RoleModel[];

    //У одного пользователя могут быть несколько refresh tokens

    @HasMany(() => RefreshTokenModel, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    refresh_tokens: RefreshTokenModel[];

    @BelongsToMany(() => ProductModel, {
        through: () => RatingModel,
        onDelete: 'CASCADE',
    })
    products: ProductModel[];

    @HasMany(() => OrderModel, { onDelete: 'SET NULL' })
    orders: OrderModel[];
}
