import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from './user.model';

export interface IPasswordResetTokenModel {
    id: number;
    userId: number;
    tenantId: number | null;
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    usedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPasswordResetTokenCreationAttributes {
    userId: number;
    tenantId?: number | null;
    token: string;
    expiresAt: Date;
    isUsed?: boolean;
    usedAt?: Date | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

@Table({
    tableName: 'password_reset_tokens',
    timestamps: true,
    underscored: false,
})
export class PasswordResetTokenModel
    extends Model<
        IPasswordResetTokenModel,
        IPasswordResetTokenCreationAttributes
    >
    implements IPasswordResetTokenModel
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
        type: DataType.INTEGER,
        allowNull: true,
        field: 'tenant_id',
        comment: 'SaaS tenant isolation',
    })
    declare tenantId: number | null;

    @Column({
        type: DataType.STRING(64),
        allowNull: false,
        unique: true,
    })
    declare token: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'expires_at',
    })
    declare expiresAt: Date;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_used',
    })
    declare isUsed: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'used_at',
    })
    declare usedAt: Date | null;

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

    /**
     * Проверяет валидность токена
     * @returns true если токен не использован и не истёк
     */
    isValid(): boolean {
        const now = new Date();
        return !this.isUsed && this.expiresAt > now;
    }
}
