import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { BrandModel, BrandCreationAttributes } from './types';

class Brand
    extends Model<BrandModel, BrandCreationAttributes>
    implements BrandModel
{
    declare id: number;
    declare name: string;
    declare slug: string;
    declare description?: string;
    declare isActive: boolean;
    declare logo?: string;
    declare category_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, any>): void {
        this.hasMany(models.product, {
            as: TABLE_NAMES.PRODUCT,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });
        this.belongsTo(models.category, {
            as: TABLE_NAMES.CATEGORY,
            foreignKey: 'category_id',
            onUpdate: 'RESTRICT',
        });
    }
}

export default function defineBrand(sequelize: Sequelize): typeof Brand {
    Brand.init(
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
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.CATEGORY,
                    key: 'id',
                } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
            logo: {
                type: DataTypes.STRING(500),
                allowNull: true,
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
            modelName: TABLE_NAMES.BRAND,
            tableName: TABLE_NAMES.BRAND,
            timestamps: true,
            underscored: false,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return Brand;
}
