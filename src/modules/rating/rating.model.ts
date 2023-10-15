import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from '../user/user.model';
import { ProductModel } from '../product/product.model';

@Table({
    tableName: 'rating',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class RatingModel extends Model<RatingModel> {
    @Column({ type: DataType.INTEGER, allowNull: false })
    rating: number;

    @ForeignKey(() => UserModel)
    @Column({ type: DataType.INTEGER })
    userId: number;

    @ForeignKey(() => ProductModel)
    @Column({ type: DataType.INTEGER })
    productId: number;
}
