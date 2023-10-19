import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { ProductModel } from '../product/product.model';

interface ICategoryCreationAttributes {
    name: string;
}

interface Category {
    id: number;
    name: string;
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
    implements Category
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

    @HasMany(() => ProductModel, { onDelete: 'RESTRICT' })
    products: ProductModel[];
}
