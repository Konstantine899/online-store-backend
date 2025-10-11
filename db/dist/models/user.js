"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineUser;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class User extends sequelize_1.Model {
    static associate(models) {
        this.hasMany(models.refreshToken, {
            as: consts_1.TABLE_NAMES.REFRESH_TOKEN,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
        this.hasMany(models.order, {
            as: consts_1.TABLE_NAMES.ORDER,
            onDelete: 'SET NULL',
        });
        this.belongsToMany(models.role, {
            through: consts_1.TABLE_NAMES.USER_ROLE,
            as: consts_1.TABLE_NAMES.ROLE,
        });
        this.belongsToMany(models.product, {
            through: consts_1.TABLE_NAMES.RATING,
            as: consts_1.TABLE_NAMES.PRODUCT,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}
function defineUser(sequelize) {
    User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        email: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        phone: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^\+?[1-9]\d{0,15}$/,
            },
        },
        first_name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        last_name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        is_active: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        is_newsletter_subscribed: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_marketing_consent: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_cookie_consent: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_profile_completed: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_vip_customer: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_beta_tester: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_blocked: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_premium: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_email_verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_phone_verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_terms_accepted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_privacy_accepted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_age_verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_two_factor_enabled: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_deleted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_suspended: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_affiliate: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_employee: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_high_value: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_wholesale: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        preferred_language: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'ru',
        },
        timezone: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'Europe/Moscow',
        },
        notification_preferences: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
        },
        theme_preference: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'light',
        },
        default_language: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'ru',
        },
        translations: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
        },
        email_verified_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        phone_verified_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        last_login_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        modelName: consts_1.TABLE_NAMES.USER,
        tableName: consts_1.TABLE_NAMES.USER,
        timestamps: true,
        underscored: false,
    });
    return User;
}
