import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from './user.model';

interface IUserAddressCreationAttributes {
    user_id: number;
    title: string;
    street: string;
    house: string;
    apartment?: string;
    city: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}

@Table({
    tableName: 'user_address',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
    },
})
export class UserAddressModel extends Model<
    UserAddressModel,
    IUserAddressCreationAttributes
> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare user_id: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
        validate: { len: [1, 100] },
    })
    declare title: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        validate: { len: [1, 255] },
    })
    declare street: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        validate: { len: [1, 20] },
    })
    declare house: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
        validate: { len: [1, 20] },
    })
    declare apartment?: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
        validate: { len: [1, 100] },
    })
    declare city: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
        validate: { len: [1, 20] },
    })
    declare postal_code?: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
        defaultValue: 'Россия',
        validate: { len: [1, 100] },
    })
    declare country: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare is_default: boolean;

    @BelongsTo(() => UserModel)
    declare user: UserModel;
}
