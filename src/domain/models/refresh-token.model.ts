import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from './user.model';

interface IRefreshTokenModel {
    id: number;
    is_revoked: boolean;
    expires: Date;
    user_id: number;
    user: UserModel;
}

@Table({
    tableName: 'refresh-token',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class RefreshTokenModel
    extends Model<RefreshTokenModel>
    implements IRefreshTokenModel
{
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
    })
    is_revoked!: boolean; // аннулировать или нет

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    expires!: Date;

    @ForeignKey(() => UserModel)
    @Column({ type: DataType.INTEGER })
    user_id!: number;

    // У одного refresh token может быть только один пользователь

    @BelongsTo(() => UserModel)
    user!: UserModel;
}
