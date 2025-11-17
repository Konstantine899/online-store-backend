"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineTenant;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Tenant extends sequelize_1.Model {
    static associate(models) {
        this.belongsToMany(models.user, {
            through: 'tenant_users',
            foreignKey: 'tenant_id',
            otherKey: 'user_id',
            as: 'users',
        });
        this.hasMany(models.product, {
            foreignKey: 'tenant_id',
            as: 'products',
        });
        this.hasMany(models.category, {
            foreignKey: 'tenant_id',
            as: 'categories',
        });
        this.hasMany(models.brand, {
            foreignKey: 'tenant_id',
            as: 'brands',
        });
        this.hasMany(models.cart, {
            foreignKey: 'tenant_id',
            as: 'carts',
        });
        this.hasMany(models.order, {
            foreignKey: 'tenant_id',
            as: 'orders',
        });
    }
}
function defineTenant(sequelize) {
    Tenant.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        subdomain: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
            unique: true,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'suspended', 'deleted'),
            allowNull: false,
            defaultValue: 'active',
        },
        plan: {
            type: sequelize_1.DataTypes.ENUM('free', 'starter', 'professional', 'enterprise'),
            allowNull: false,
            defaultValue: 'free',
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: consts_1.TABLE_NAMES.TENANT,
        tableName: 'tenants',
        timestamps: true,
        underscored: true,
    });
    return Tenant;
}
