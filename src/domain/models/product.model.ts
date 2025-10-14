import { Op } from 'sequelize';
import {
    BelongsTo,
    BelongsToMany,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { BrandModel } from './brand.model';
import { CartProductModel } from './cart-product.model';
import { CartModel } from './cart.model';
import { CategoryModel } from './category-model';
import { ProductPropertyModel } from './product-property.model';
import { RatingModel } from './rating.model';
import { UserModel } from './user.model';

interface IProductCreationAttributes {
    name: string;
    price: number;
    image: string;
    category_id: number;
    brand_id: number;
    tenant_id?: number;
    slug?: string;
    description?: string;
    isActive?: boolean;
    stock?: number;
}

interface IProduct {
    id: number;
    name: string;
    price: number;
    rating: number;
    image: string;
    slug: string;
    description?: string;
    isActive: boolean;
    stock: number;
    category_id: number;
    category: CategoryModel;
    brand_id: number;
    brand: BrandModel;
    tenant_id: number;
    properties: ProductPropertyModel[];
    baskets: CartModel[];
    users: UserModel[];
    ratingsCount?: number;
    averageRating?: number;
}

@Table({
    tableName: 'product',
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
        inStock: {
            where: { stock: { [Op.gt]: 0 } },
        },
        withCategory: {
            include: [
                {
                    model: CategoryModel,
                    attributes: ['id', 'name', 'slug'],
                },
            ],
        },
        withBrand: {
            include: [
                {
                    model: BrandModel,
                    attributes: ['id', 'name', 'slug'],
                },
            ],
        },
    },
    indexes: [
        {
            fields: ['name'],
            unique: true,
            name: 'idx_product_name_unique',
        },
        {
            fields: ['slug'],
            unique: true,
            name: 'idx_product_slug_unique',
        },
        {
            fields: ['isActive'],
            name: 'idx_product_is_active',
        },
        {
            fields: ['price'],
            name: 'idx_product_price',
        },
        {
            fields: ['category_id'],
            name: 'idx_product_category_id',
        },
        {
            fields: ['brand_id'],
            name: 'idx_product_brand_id',
        },
    ],
})
export class ProductModel
    extends Model<ProductModel, IProductCreationAttributes>
    implements IProduct
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
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01,
            max: 999999.99,
        },
    })
    price!: number;

    @Column({
        type: DataType.FLOAT,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 5,
        },
    })
    rating!: number;

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
            len: [0, 2000],
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
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    })
    stock!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        comment: 'Tenant ID for multi-tenant isolation',
    })
    tenant_id!: number;

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

    @ForeignKey(() => BrandModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    brand_id!: number;

    @BelongsTo(() => BrandModel, {
        foreignKey: 'brand_id',
        onUpdate: 'RESTRICT',
        hooks: true,
        as: 'brand',
    })
    brand!: BrandModel;

    @HasMany(() => ProductPropertyModel, {
        foreignKey: 'product_id',
        onDelete: 'CASCADE',
        hooks: true,
        as: 'properties',
    })
    properties!: ProductPropertyModel[];

    @BelongsToMany(() => CartModel, {
        through: () => CartProductModel,
        foreignKey: 'product_id',
        otherKey: 'cart_id',
        onDelete: 'CASCADE',
        hooks: true,
        as: 'baskets',
    })
    baskets!: CartModel[];

    @BelongsToMany(() => UserModel, {
        through: () => RatingModel,
        foreignKey: 'product_id',
        otherKey: 'user_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        hooks: true,
        as: 'users',
    })
    users!: UserModel[];

    // Виртуальные поля для производительности
    get ratingsCount(): number {
        return this.users?.length || 0;
    }

    get averageRating(): number {
        return this.rating || 0;
    }

    get isInStock(): boolean {
        return this.stock > 0;
    }

    // Базовые статические методы
    static async findActiveInStock(): Promise<ProductModel[]> {
        return this.scope(['active', 'inStock']).findAll();
    }

    static async findBySlug(slug: string): Promise<ProductModel | null> {
        return this.scope('active').findOne({ where: { slug } });
    }

    static async findByCategory(categoryId: number): Promise<ProductModel[]> {
        return this.scope(['active', 'withCategory']).findAll({
            where: { category_id: categoryId },
        });
    }

    static async findByBrand(brandId: number): Promise<ProductModel[]> {
        return this.scope(['active', 'withBrand']).findAll({
            where: { brand_id: brandId },
        });
    }
}
