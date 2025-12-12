import type { Sequelize } from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import type {
    LoginHistoryAttributes,
    LoginHistoryCreationAttributes,
} from './types';
import type defineUser from './user';

// Precise types for associated user model
type UserCtor = ReturnType<typeof defineUser>;
type UserInstance = InstanceType<UserCtor>;

class LoginHistory
    extends Model<LoginHistoryAttributes, LoginHistoryCreationAttributes>
    implements LoginHistoryAttributes
{
    declare id: number;
    declare user_id: number;
    declare ip_address: string | null;
    declare user_agent: string | null;
    declare success: boolean;
    declare failure_reason: string | null;
    declare login_at: Date;
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

export default function defineLoginHistory(
    sequelize: Sequelize,
): typeof LoginHistory {
    LoginHistory.init(
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
            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            success: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            failure_reason: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            login_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
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
            modelName: TABLE_NAMES.LOGIN_HISTORY,
            tableName: TABLE_NAMES.LOGIN_HISTORY,
            timestamps: true,
            underscored: false,
        },
    );

    return LoginHistory;
}
