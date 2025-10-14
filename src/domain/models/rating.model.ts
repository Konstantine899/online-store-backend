import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { ProductModel } from './product.model';
import { UserModel } from './user.model';

interface IRatingModel {
    rating: number;
    user_id: number;
    product_id: number;
    tenant_id?: number;
}

@Table({
    tableName: 'rating',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class RatingModel extends Model<RatingModel> implements IRatingModel {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    rating!: number;

    @ForeignKey(() => UserModel)
    @Column({ type: DataType.INTEGER })
    user_id!: number;

    @ForeignKey(() => ProductModel)
    @Column({ type: DataType.INTEGER })
    product_id!: number;

    @Column({ type: DataType.INTEGER, allowNull: true, field: 'tenant_id' })
    tenant_id?: number;
}
