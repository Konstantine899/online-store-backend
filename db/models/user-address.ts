import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES, USER_ID } from '../consts';
import { UserAddressAttributes, UserAddressCreationAttributes } from './types';

class UserAddress
    extends Model<UserAddressAttributes, UserAddressCreationAttributes>
    implements UserAddressAttributes
{
    declare id: number;
    declare user_id: number;
    declare title: string;
    declare street: string;
    declare house: string;
    declare apartment?: string;
    declare city: string;
    declare postal_code?: string;
    declare country: string;
    declare is_default: boolean;
    declare created_at: Date;
    declare updated_at: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, any>): void {
        this.belongsTo(models.user, {
            as: TABLE_NAMES.USER,
            foreignKey: USER_ID,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}

export default function defineUserAddress(sequelize: Sequelize): typeof UserAddress {
    UserAddress.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.USER,
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            title: {
                type: DataTypes.STRING(100),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            street: {
                type: DataTypes.STRING(255),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            house: {
                type: DataTypes.STRING(20),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            apartment: {
                type: DataTypes.STRING(20),
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            city: {
                type: DataTypes.STRING(100),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            postal_code: {
                type: DataTypes.STRING(20),
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            country: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: 'Россия',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            is_default: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
            sequelize,
            modelName: 'user_address',
            tableName: 'user_address',
            timestamps: true,
            underscored: true,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return UserAddress;
}