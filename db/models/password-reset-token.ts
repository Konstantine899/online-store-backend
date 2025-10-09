import { DataTypes, Model, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import defineUser from './user';

// Precise types for associated user model
type UserCtor = ReturnType<typeof defineUser>;
type UserInstance = InstanceType<UserCtor>;

export interface PasswordResetTokenAttributes {
    id: number;
    user_id: number;
    tenant_id: number | null;
    token: string;
    expires_at: Date;
    is_used: boolean;
    used_at: Date | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface PasswordResetTokenCreationAttributes {
    user_id: number;
    tenant_id?: number | null;
    token: string;
    expires_at: Date;
    is_used?: boolean;
    used_at?: Date | null;
    ip_address?: string | null;
    user_agent?: string | null;
}

class PasswordResetToken
    extends Model<
        PasswordResetTokenAttributes,
        PasswordResetTokenCreationAttributes
    >
    implements PasswordResetTokenAttributes
{
    declare id: number;
    declare user_id: number;
    declare tenant_id: number | null;
    declare token: string;
    declare expires_at: Date;
    declare is_used: boolean;
    declare used_at: Date | null;
    declare ip_address: string | null;
    declare user_agent: string | null;
    declare created_at: Date;
    declare updated_at: Date;

    // Associations
    declare getUser: () => Promise<UserInstance>;
    declare user?: UserInstance;

    static associate(models: { user: UserCtor }): void {
        this.belongsTo(models.user, {
            foreignKey: 'user_id',
            as: TABLE_NAMES.USER,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}

export default function definePasswordResetToken(
    sequelize: Sequelize,
): typeof PasswordResetToken {
    PasswordResetToken.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            tenant_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'SaaS tenant isolation',
            },
            token: {
                type: DataTypes.STRING(64),
                allowNull: false,
                unique: true,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            is_used: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            used_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: TABLE_NAMES.PASSWORD_RESET_TOKEN,
            tableName: 'password_reset_tokens',
            timestamps: true,
            underscored: false,
            indexes: [
                {
                    fields: ['user_id'],
                },
                {
                    fields: ['token'],
                    unique: true,
                },
                {
                    fields: ['expires_at'],
                },
                {
                    fields: ['is_used'],
                },
            ],
        },
    );

    return PasswordResetToken;
}

// TypeScript types export for domain layer compatibility
export type PasswordResetTokenModel = PasswordResetToken;
