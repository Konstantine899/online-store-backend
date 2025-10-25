import type { Sequelize } from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import type { UserAttributes, UserCreationAttributes } from './types';

class User
    extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes
{
    declare id: number;
    declare email: string;
    declare password: string;
    declare phone?: string;
    declare first_name?: string;
    declare last_name?: string;
    // Flags
    declare is_active: boolean;
    declare is_newsletter_subscribed: boolean;
    declare is_marketing_consent: boolean;
    declare is_cookie_consent: boolean;
    declare is_profile_completed: boolean;
    declare is_vip_customer: boolean;
    declare is_beta_tester: boolean;
    declare is_blocked: boolean;
    declare is_verified: boolean;
    declare is_premium: boolean;
    declare is_email_verified: boolean;
    declare is_phone_verified: boolean;
    declare is_terms_accepted: boolean;
    declare is_privacy_accepted: boolean;
    declare is_age_verified: boolean;
    declare is_two_factor_enabled: boolean;
    declare is_deleted: boolean;
    declare is_suspended: boolean;
    declare is_affiliate: boolean;
    declare is_employee: boolean;
    declare is_high_value: boolean;
    declare is_wholesale: boolean;
    // Preferences/meta
    declare preferred_language: string;
    declare timezone: string;
    declare notification_preferences: unknown | null;
    declare theme_preference: string;
    declare default_language: string;
    declare translations: unknown | null;
    // Timestamps
    declare email_verified_at: Date | null;
    declare phone_verified_at: Date | null;
    declare last_login_at: Date | null;
    declare created_at: Date;
    declare updated_at: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, any>): void {
        this.hasMany(models.refreshToken, {
            as: TABLE_NAMES.REFRESH_TOKEN,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
        this.hasMany(models.order, {
            as: TABLE_NAMES.ORDER,
            onDelete: 'SET NULL',
        });
        this.belongsToMany(models.role, {
            through: TABLE_NAMES.USER_ROLE,
            as: TABLE_NAMES.ROLE,
        });
        this.belongsToMany(models.product, {
            through: TABLE_NAMES.RATING,
            as: TABLE_NAMES.PRODUCT,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}

export default function defineUser(sequelize: Sequelize): typeof User {
    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true,
                validate: {
                    // E.164: начало с +, только цифры, до 16 символов включая +
                    is: /^\+?[1-9]\d{0,15}$/,
                },
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            first_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            last_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            // New flags
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            is_newsletter_subscribed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_marketing_consent: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_cookie_consent: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_profile_completed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_vip_customer: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_beta_tester: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_blocked: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_premium: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_email_verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_phone_verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_terms_accepted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_privacy_accepted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_age_verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_two_factor_enabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_suspended: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_affiliate: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_employee: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_high_value: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_wholesale: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            // Preferences/meta
            preferred_language: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: 'ru',
            },
            timezone: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: 'Europe/Moscow',
            },
            notification_preferences: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: null,
            },
            theme_preference: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'light',
            },
            default_language: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: 'ru',
            },
            translations: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: null,
            },
            // Timestamps
            email_verified_at: { type: DataTypes.DATE, allowNull: true },
            phone_verified_at: { type: DataTypes.DATE, allowNull: true },
            last_login_at: { type: DataTypes.DATE, allowNull: true },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
            sequelize,
            modelName: TABLE_NAMES.USER,
            tableName: TABLE_NAMES.USER,
            timestamps: true,
            underscored: false,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return User;
}
