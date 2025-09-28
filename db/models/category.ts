import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { CategoryModel, CategoryCreationAttributes } from './types';

class Category
    extends Model<CategoryModel, CategoryCreationAttributes>
    implements CategoryModel
{
    declare id: number;
    declare name: string;
    declare image: string;
    declare slug: string;
    declare description?: string;
    declare isActive: boolean;
    declare created_at: Date;
    declare updated_at: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        this.hasMany(models.product, {
            as: TABLE_NAMES.PRODUCT,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });
        this.hasMany(models.brand, {
            as: TABLE_NAMES.BRAND,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });
    }
}

export default function defineCategory(sequelize: Sequelize): typeof Category {
    Category.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            image: {
                type: DataTypes.STRING,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            slug: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
            modelName: TABLE_NAMES.CATEGORY,
            tableName: TABLE_NAMES.CATEGORY,
            timestamps: true,
            underscored: false,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return Category;
}
