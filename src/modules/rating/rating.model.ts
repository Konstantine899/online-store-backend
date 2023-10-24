import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from '../user/user.model';
import { ProductModel } from '../product/product.model';

interface Rating {
    rating: number;
    user_id: number;
    product_id: number;
}

@Table({
    tableName: 'rating',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class RatingModel extends Model<RatingModel> implements Rating {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    rating: number;

    @ForeignKey(() => UserModel)
    @Column({ type: DataType.INTEGER })
    user_id: number;

    @ForeignKey(() => ProductModel)
    @Column({ type: DataType.INTEGER })
    product_id: number;
}
