import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { ProductModel } from './product.model';
import { BrandModel } from '@app/domain/models/brand.model';

interface ICategoryCreationAttributes {
    name: string;
    image: string;
}

interface ICategoryModel {
    id: number;
    name: string;
    image: string;
    products: ProductModel[];
}

@Table({
    tableName: 'category',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
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
    id: number;

    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    image: string;

    @HasMany(() => ProductModel, { onDelete: 'RESTRICT' })
    products: ProductModel[];

    @HasMany(() => BrandModel, { onDelete: 'RESTRICT' })
    brands: BrandModel[];
}
