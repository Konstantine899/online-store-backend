import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { TABLE_NAMES } from '../consts';

export interface UserVerificationCodeAttributes {
    id: number;
    user_id: number;
    channel: 'email' | 'phone';
    code_hash: string;
    expires_at: Date;
    attempts: number;
    created_at: Date;
    updated_at: Date;
}

type UserVerificationCodeCreationAttributes = Optional<
    UserVerificationCodeAttributes,
    'id' | 'attempts' | 'created_at' | 'updated_at'
>;

class UserVerificationCode
    extends Model<
        UserVerificationCodeAttributes,
        UserVerificationCodeCreationAttributes
    >
    implements UserVerificationCodeAttributes
{
    declare id: number;
    declare user_id: number;
    declare channel: 'email' | 'phone';
    declare code_hash: string;
    declare expires_at: Date;
    declare attempts: number;
    declare created_at: Date;
    declare updated_at: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, any>): void {
        this.belongsTo(models.user, {
            foreignKey: 'user_id',
            as: TABLE_NAMES.USER,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}

export default function defineUserVerificationCode(
    sequelize: Sequelize,
): typeof UserVerificationCode {
    UserVerificationCode.init(
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
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            channel: {
                type: DataTypes.STRING(16),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            code_hash: {
                type: DataTypes.STRING(255),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            attempts: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
            modelName: 'userVerificationCode',
            tableName: 'user_verification_code',
            timestamps: true,
            underscored: true,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return UserVerificationCode;
}
