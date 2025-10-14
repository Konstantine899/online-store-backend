import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from './user.model';

export interface ILoginHistoryModel {
    id: number;
    userId: number;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    failureReason: string | null;
    loginAt: Date;
    tenant_id?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ILoginHistoryCreationAttributes {
    userId: number;
    ipAddress?: string | null;
    userAgent?: string | null;
    success?: boolean;
    failureReason?: string | null;
    loginAt?: Date;
    tenant_id?: number;
}

@Table({
    tableName: 'login_history',
    timestamps: true,
    underscored: false,
})
export class LoginHistoryModel
    extends Model<ILoginHistoryModel, ILoginHistoryCreationAttributes>
    implements ILoginHistoryModel
{
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
        field: 'user_id',
    })
    declare userId: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: true,
        field: 'ip_address',
    })
    declare ipAddress: string | null;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        field: 'user_agent',
    })
    declare userAgent: string | null;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
    declare success: boolean;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        field: 'failure_reason',
    })
    declare failureReason: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'login_at',
    })
    declare loginAt: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'tenant_id',
        comment: 'Tenant ID for multi-tenant isolation',
    })
    declare tenant_id?: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'created_at',
    })
    declare createdAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'updated_at',
    })
    declare updatedAt: Date;

    // Associations
    @BelongsTo(() => UserModel)
    declare user: UserModel;
}
