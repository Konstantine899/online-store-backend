import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { ProductModel } from '../product/product.model';
import { ApiProperty } from '@nestjs/swagger';

interface ProductProperty {
    id: number;
    name: string;
    value: string;
    product_id: number;
    product: ProductModel;
}

@Table({
    tableName: 'product-property',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class ProductPropertyModel
    extends Model<ProductPropertyModel>
    implements ProductProperty
{
    @ApiProperty({
        example: 1,
        description: 'Идентификатор свойство продукта',
    })
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    id: number;

    @ApiProperty({
        example: 'Экран:',
        description: 'Имя свойства',
    })
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name: string;

    @ApiProperty({
        example: '6.67  1080x2400 пикселей, AMOLED',
        description: 'Значение свойства',
    })
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    value: string;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор продукта',
    })
    @ForeignKey(() => ProductModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    product_id: number;

    @BelongsTo(() => ProductModel)
    product: ProductModel;
}
