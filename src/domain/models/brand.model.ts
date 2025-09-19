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
import { CategoryModel } from '@app/domain/models/category-model';

interface ICreateBrandAttributes {
    name: string;
}

interface IBrandModel {
    id: number;
    name: string;
    products: ProductModel[];
}

@Table({
    tableName: 'brand',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
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
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    name!: string;

    @HasMany(() => ProductModel, { onDelete: 'RESTRICT' })
    products!: ProductModel[];

    @ForeignKey(() => CategoryModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    category_id!: number;

    @BelongsTo(() => CategoryModel, 'category_id')
    category!: CategoryModel;
}
