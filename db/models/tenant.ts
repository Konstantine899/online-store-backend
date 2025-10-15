import { DataTypes, Model, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { TenantCreationAttributes, TenantModel } from './types';

class Tenant
    extends Model<TenantModel, TenantCreationAttributes>
    implements TenantModel
{
    declare id: number;
    declare name: string;
    declare subdomain: string | null;
    declare status: 'active' | 'suspended' | 'deleted';
    declare plan: 'free' | 'starter' | 'professional' | 'enterprise';
    declare created_at: Date;
    declare updated_at: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, any>): void {
        // Many-to-many: tenants ↔ users через tenant_users
        this.belongsToMany(models.user, {
            through: 'tenant_users',
            foreignKey: 'tenant_id',
            otherKey: 'user_id',
            as: 'users',
        });

        // Has many relationships для tenant-owned data
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

export default function defineTenant(sequelize: Sequelize): typeof Tenant {
    Tenant.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            subdomain: {
                type: DataTypes.STRING(100),
                allowNull: true,
                unique: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            status: {
                type: DataTypes.ENUM('active', 'suspended', 'deleted'),
                allowNull: false,
                defaultValue: 'active',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            plan: {
                type: DataTypes.ENUM(
                    'free',
                    'starter',
                    'professional',
                    'enterprise',
                ),
                allowNull: false,
                defaultValue: 'free',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
            sequelize,
            modelName: TABLE_NAMES.TENANT,
            tableName: 'tenants',
            timestamps: true,
            underscored: true,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return Tenant;
}
