import { Column, DataType, HasMany, Model, Table, CreatedAt,
    UpdatedAt, } from 'sequelize-typescript';
import { ProductModel } from './product.model';


interface ICategoryModel {
    id: number;
    name: string;
    image: string;
    slug: string;
    description?: string;
    isActive: boolean;
    products: ProductModel[];
    createdAt: Date; // НОВОЕ
    updatedAt: Date; // НОВОЕ
}

interface ICategoryCreationAttributes {
    name: string;
    image: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
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
            include: [{
                model: ProductModel,
                attributes: ['id', 'name', 'price', 'image'],
            }],
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
    ],
})
export class CategoryModel extends Model<ICategoryModel, ICategoryCreationAttributes> implements ICategoryModel
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
            is: /^[а-яА-Яa-zA-Z0-9\s\-_.,!?()]+$/i,
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
        onUpdate: 'CASCADE',
        hooks: true,
        as: 'products',
    })
    products!: ProductModel[];

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'created_at',
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'updated_at',
    })
    declare updatedAt: Date;
    

    static async findBySlug(slug: string): Promise<CategoryModel | null> {
        return this.findOne({ where: { slug, isActive: true } });
    }
}
