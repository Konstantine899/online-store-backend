import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { ProductModel } from './product.model';
import { BrandModel } from './brand.model';

interface ICategoryCreationAttributes {
    name: string;
    image: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
}

interface ICategoryModel {
    id: number;
    name: string;
    image: string;
    slug: string;
    description?: string;
    isActive: boolean;
    products: ProductModel[];
    brands?: BrandModel[];
    productsCount?: number;
    brandsCount?: number;
}

@Table({
    tableName: 'category',
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
        withProducts: {
            include: [ProductModel],
        },
        withBrands: {
            include: [BrandModel],
        },
        withAll: {
            include: [ProductModel, BrandModel],
        },
        withCounts: {
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                    attributes: [],
                },
                {
                    model: BrandModel,
                    as: 'brands',
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    ['COUNT(products.id)', 'productsCount'],
                    ['COUNT(brands.id)', 'brandsCount'],
                ],
            },
            group: ['CategoryModel.id'],
        },
    },
    indexes: [
        {
            fields: ['name'],
            unique: true,
            name: 'idx_category_name_unique',
        },
        {
            fields: ['slug'],
            unique: true,
            name: 'idx_category_slug_unique',
        },
        {
            fields: ['isActive'],
            name: 'idx_category_is_active',
        },
        {
            fields: ['image'],
            name: 'idx_category_image',
        },
        {
            fields: ['isActive', 'name'],
            name: 'idx_category_active_name',
        },
    ],
})
export class CategoryModel
    extends Model<CategoryModel, ICategoryCreationAttributes>
    implements ICategoryModel
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
        type: DataType.STRING(500),
        allowNull: false,
        validate: {
            len: [1, 500],
            notEmpty: true,
            isUrl: true,
        },
    })
    image!: string;

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
            this.setDataValue('slug', value?.trim()?.toLowerCase()?.replace(/\s+/g, '-'));
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

    @HasMany(() => ProductModel, { 
        foreignKey: 'category_id',
        onDelete: 'RESTRICT', 
        onUpdate: 'RESTRICT',
        hooks: true,
        as: 'products',
    })
    products!: ProductModel[];

    @HasMany(() => BrandModel, { 
        foreignKey: 'category_id',
        onDelete: 'RESTRICT', 
        onUpdate: 'RESTRICT',
        hooks: true,
        as: 'brands',
    })
    brands!: BrandModel[];

    // Виртуальные поля для производительности
    get productsCount(): number {
        return this.products?.length || 0;
    }

    get brandsCount(): number {
        return this.brands?.length || 0;
    }

    // Методы для оптимизации запросов
    static async findActiveWithCounts(): Promise<CategoryModel[]> {
        return this.scope(['active', 'withCounts']).findAll();
    }

    static async findBySlug(slug: string): Promise<CategoryModel | null> {
        return this.findOne({ where: { slug, isActive: true } });
    }

    static async findWithProducts(categoryId: number): Promise<CategoryModel | null> {
        return this.scope('withProducts').findByPk(categoryId);
    }
}
