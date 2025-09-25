import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { RatingModel, RatingCreationAttributes } from './types';

class Rating
    extends Model<RatingModel, RatingCreationAttributes>
    implements RatingModel
{
    declare id: number;
    declare rating: number;
    declare user_id: number;
    declare product_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(): void {
        // Rating is a junction table, associations are handled by the main models
    }
}

export default function defineRating(sequelize: Sequelize): typeof Rating {
    Rating.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            rating: {
                type: DataTypes.INTEGER,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.USER,
                    key: 'id',
                } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.PRODUCT,
                    key: 'id',
                } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
            sequelize,
            modelName: TABLE_NAMES.RATING,
            tableName: TABLE_NAMES.RATING,
            timestamps: true,
            underscored: false,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return Rating;
}
