import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { ProductModel } from './product.model';
import { CategoryModel } from './category-model';
import { BrandModel } from './brand.model';
import { CartModel } from './cart.model';
import { OrderModel } from './order.model';

interface ICreateTenantAttributes {
    name: string;
    subdomain?: string;
    status?: 'active' | 'suspended' | 'deleted';
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
}

interface ITenantModel {
    id: number;
    name: string;
    subdomain: string | null;
    status: 'active' | 'suspended' | 'deleted';
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    created_at: Date;
    updated_at: Date;
}

@Table({
    tableName: 'tenants',
    underscored: true,
    timestamps: true,
    paranoid: false,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        active: {
            where: { status: 'active' },
        },
    },
    indexes: [
        {
            fields: ['subdomain'],
            unique: true,
            name: 'idx_tenants_subdomain',
        },
        {
            fields: ['status'],
            name: 'idx_tenants_status',
        },
        {
            fields: ['plan'],
            name: 'idx_tenants_plan',
        },
    ],
})
export class TenantModel
    extends Model<TenantModel, ICreateTenantAttributes>
    implements ITenantModel
{
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            len: [1, 255],
            notEmpty: true,
        },
    })
    name!: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
            len: [1, 100],
            is: /^[a-z0-9\-]+$/i, // Only alphanumeric and hyphens
        },
    })
    subdomain!: string | null;

    @Column({
        type: DataType.ENUM('active', 'suspended', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
    })
    status!: 'active' | 'suspended' | 'deleted';

    @Column({
        type: DataType.ENUM('free', 'starter', 'professional', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
    })
    plan!: 'free' | 'starter' | 'professional' | 'enterprise';

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    updated_at!: Date;

    // Relationships
    @HasMany(() => ProductModel, {
        foreignKey: 'tenant_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'products',
    })
    products!: ProductModel[];

    @HasMany(() => CategoryModel, {
        foreignKey: 'tenant_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'categories',
    })
    categories!: CategoryModel[];

    @HasMany(() => BrandModel, {
        foreignKey: 'tenant_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'brands',
    })
    brands!: BrandModel[];

    @HasMany(() => CartModel, {
        foreignKey: 'tenant_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'carts',
    })
    carts!: CartModel[];

    @HasMany(() => OrderModel, {
        foreignKey: 'tenant_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'orders',
    })
    orders!: OrderModel[];

    // Static methods
    static async findBySubdomain(
        subdomain: string,
    ): Promise<TenantModel | null> {
        return this.scope('active').findOne({ where: { subdomain } });
    }

    static async findActiveById(id: number): Promise<TenantModel | null> {
        return this.scope('active').findByPk(id);
    }
}
