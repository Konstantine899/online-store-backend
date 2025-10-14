import { CategoryModel } from '@app/domain/models/category-model';
import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { ProductModel } from './product.model';

interface ICreateBrandAttributes {
    name: string;
    category_id: number;
    tenant_id?: number;
    slug?: string;
    description?: string;
    isActive?: boolean;
    logo?: string;
}

interface IBrandModel {
    id: number;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    logo?: string;
    category_id: number;
    tenant_id: number;
    category: CategoryModel;
    products: ProductModel[];
    productsCount?: number;
}

@Table({
    tableName: 'brand',
    underscored: true,
    timestamps: true,
    paranoid: false,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        active: {
            where: { isActive: true },
        },
        withCategory: {
            include: [CategoryModel],
        },
        withProducts: {
            include: [ProductModel],
        },
        withAll: {
            include: [CategoryModel, ProductModel],
        },
        withCounts: {
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                    attributes: [],
                },
            ],
            attributes: {
                include: [['COUNT(products.id)', 'productsCount']],
            },
            group: ['BrandModel.id'],
        },
    },
    indexes: [
        {
            fields: ['name'],
            unique: true,
            name: 'idx_brand_name_unique',
        },
        {
            fields: ['slug'],
            unique: true,
            name: 'idx_brand_slug_unique',
        },
        {
            fields: ['isActive'],
            name: 'idx_brand_is_active',
        },
        {
            fields: ['category_id'],
            name: 'idx_brand_category_id',
        },
        {
            fields: ['name', 'category_id'],
            name: 'idx_brand_name_category',
        },
        {
            fields: ['isActive', 'category_id'],
            name: 'idx_brand_active_category',
        },
    ],
})
export class BrandModel
    extends Model<BrandModel, ICreateBrandAttributes>
    implements IBrandModel
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
        validate: {
            len: [1, 255],
            notEmpty: true,
            is: /^[a-zA-Z0-9\s\-_]+$/i,
        },
        set(value: string) {
            this.setDataValue('name', value?.trim()?.toLowerCase());
        },
    })
    name!: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            len: [1, 255],
            notEmpty: true,
            is: /^[a-z0-9\-_]+$/i,
        },
        set(value: string) {
            this.setDataValue(
                'slug',
                value?.trim()?.toLowerCase()?.replace(/\s+/g, '-'),
            );
        },
    })
    slug!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000],
        },
    })
    description?: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
    isActive!: boolean;

    @Column({
        type: DataType.STRING(500),
        allowNull: true,
        validate: {
            len: [0, 500],
            isUrl: true,
        },
    })
    logo?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        comment: 'Tenant ID for multi-tenant isolation',
    })
    tenant_id!: number;

    @HasMany(() => ProductModel, {
        foreignKey: 'brand_id',
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT',
        hooks: true,
        as: 'products',
    })
    products!: ProductModel[];

    @ForeignKey(() => CategoryModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    category_id!: number;

    @BelongsTo(() => CategoryModel, {
        foreignKey: 'category_id',
        onUpdate: 'RESTRICT',
        hooks: true,
        as: 'category',
    })
    category!: CategoryModel;

    // Виртуальные поля для производительности
    get productsCount(): number {
        return this.products?.length || 0;
    }

    // Статические методы для оптимизации запросов
    static async findActiveWithCounts(): Promise<BrandModel[]> {
        return this.scope(['active', 'withCounts']).findAll();
    }

    static async findBySlug(slug: string): Promise<BrandModel | null> {
        return this.scope('active').findOne({ where: { slug } });
    }

    static async findByCategory(categoryId: number): Promise<BrandModel[]> {
        return this.scope(['active', 'withCategory']).findAll({
            where: { category_id: categoryId },
        });
    }

    static async findWithProducts(brandId: number): Promise<BrandModel | null> {
        return this.scope('withProducts').findByPk(brandId);
    }
}
