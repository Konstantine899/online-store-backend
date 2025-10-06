import {
    BelongsToMany,
    Column,
    DataType,
    HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserRoleModel } from './user-role.model';
import { RoleModel } from './role.model';
import { RefreshTokenModel } from './refresh-token.model';
import { RatingModel } from './rating.model';
import { ProductModel } from './product.model';
import { OrderModel } from './order.model';

interface IUserCreationAttributes {
    email: string;
    password: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    // preferences (optional at creation)
    preferredLanguage?: string;
    timezone?: string;
    themePreference?: string;
    defaultLanguage?: string;
}

interface IUserModel {
    id: number;
    email: string;
    password: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    // flags
    isActive?: boolean;
    isNewsletterSubscribed?: boolean;
    isMarketingConsent?: boolean;
    isCookieConsent?: boolean;
    isProfileCompleted?: boolean;
    isVipCustomer?: boolean;
    isBetaTester?: boolean;
    isBlocked?: boolean;
    isVerified?: boolean;
    isPremium?: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isTermsAccepted?: boolean;
    isPrivacyAccepted?: boolean;
    isAgeVerified?: boolean;
    isTwoFactorEnabled?: boolean;
    isDeleted?: boolean;
    isSuspended?: boolean;
    isAffiliate?: boolean;
    isEmployee?: boolean;
    isHighValue?: boolean;
    isWholesale?: boolean;
    // preferences
    preferredLanguage?: string;
    timezone?: string;
    notificationPreferences?: unknown | null;
    themePreference?: string;
    defaultLanguage?: string;
    translations?: unknown | null;
    // timestamps meta
    emailVerifiedAt?: Date | null;
    phoneVerifiedAt?: Date | null;
    lastLoginAt?: Date | null;
    roles: RoleModel[];
    refresh_tokens: RefreshTokenModel[];
    products: ProductModel[];
    orders: OrderModel[];
}

@Table({
    tableName: 'user',
    underscored: true,
    defaultScope: {
        attributes: {
            exclude: ['updatedAt', 'createdAt', 'password'], // Исключаем пароль по умолчанию
        },
    },
    scopes: {
        // Scope для аутентификации - только необходимые поля
        forAuth: {
            attributes: ['id', 'email'],
            include: [
                {
                    model: RoleModel,
                    as: 'roles',
                    attributes: ['id', 'role'],
                    through: { attributes: [] }, // Исключаем промежуточную таблицу
                },
            ],
        },
        // Scope для загрузки пользователя с ролями
        withRoles: {
            include: [
                {
                    model: RoleModel,
                    as: 'roles',
                    attributes: ['id', 'role'],
                    through: { attributes: [] },
                },
            ],
        },
        active: {
            where: { isActive: true, isBlocked: false },
        },
        verified: {
            where: { isVerified: true },
        },
    },
})
export class UserModel
    extends Model<UserModel, IUserCreationAttributes>
    implements IUserModel
{
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true,
            len: [5, 255],
        },
    })
    declare email: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255],
        },
    })
    declare password: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
        validate: {
            // E.164: + и цифры, до 16 символов
            is: /^\+?[1-9]\d{0,15}$/,
        },
    })
    declare phone?: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    declare firstName?: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    declare lastName?: string;

    // Флаги
    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare isActive?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isNewsletterSubscribed?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isMarketingConsent?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isCookieConsent?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isProfileCompleted?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isVipCustomer?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isBetaTester?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isBlocked?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isVerified?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isPremium?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isEmailVerified?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isPhoneVerified?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isTermsAccepted?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isPrivacyAccepted?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isAgeVerified?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isTwoFactorEnabled?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isDeleted?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isSuspended?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isAffiliate?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isEmployee?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isHighValue?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare isWholesale?: boolean;

    // Предпочтения
    @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'ru' })
    declare preferredLanguage?: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        defaultValue: 'Europe/Moscow',
    })
    declare timezone?: string;

    @Column({ type: DataType.JSONB, allowNull: true })
    declare notificationPreferences?: unknown | null;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        defaultValue: 'light',
    })
    declare themePreference?: string;

    @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'ru' })
    declare defaultLanguage?: string;

    @Column({ type: DataType.JSONB, allowNull: true })
    declare translations?: unknown | null;

    // Метадаты
    @Column({ type: DataType.DATE, allowNull: true })
    declare emailVerifiedAt?: Date | null;

    @Column({ type: DataType.DATE, allowNull: true })
    declare phoneVerifiedAt?: Date | null;

    @Column({ type: DataType.DATE, allowNull: true })
    declare lastLoginAt?: Date | null;

    // Многие ко многим через промежуточную таблицу UserRoleModel
    @BelongsToMany(() => RoleModel, () => UserRoleModel, 'user_id', 'role_id')
    declare roles: RoleModel[];

    //У одного пользователя могут быть несколько refresh tokens

    @HasMany(() => RefreshTokenModel, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    declare refresh_tokens: RefreshTokenModel[];

    @BelongsToMany(() => ProductModel, {
        through: () => RatingModel,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    declare products: ProductModel[];

    @HasMany(() => OrderModel, { onDelete: 'SET NULL' })
    declare orders: OrderModel[];

    // Геттеры и методы
    get fullName(): string {
        if (this.firstName && this.lastName) {
            return `${this.firstName} ${this.lastName}`;
        }
        if (this.firstName) {
            return this.firstName;
        }
        if (this.lastName) {
            return this.lastName;
        }
        return '';
    }

    get displayName(): string {
        return this.fullName || this.email;
    }

    isCompleteProfile(): boolean {
        return !!(this.firstName && this.lastName && this.phone);
    }
}
