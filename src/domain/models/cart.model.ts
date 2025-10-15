import { literal, Op, Transaction } from 'sequelize';
import {
    BelongsTo,
    BelongsToMany,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { CartProductModel } from './cart-product.model';
import { CART_CONSTANTS, CART_STATUS } from './constants/cart.constants';
import { ProductModel } from './product.model';
import { UserModel } from './user.model';

interface ICartModel {
    id: number;
    tenant_id: number;
    user_id?: number;
    session_id?: string;
    status: string;
    expired_at?: Date;
    promo_code?: string;
    discount: number;
    total_amount: number;
    products: ProductModel[];
    user?: UserModel;
    createdAt: Date;
    updatedAt: Date;
}

interface ICartCreationAttributes {
    tenant_id?: number;
    user_id?: number;
    session_id?: string;
    status?: string;
    expired_at?: Date;
    promo_code?: string;
    discount?: number;
    total_amount?: number;
}

@Table({
    tableName: 'cart',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        // Загрузка корзины с продуктами и price snapshot
        withProducts: {
            include: [
                {
                    model: ProductModel,
                    through: { attributes: ['quantity', 'price'] },
                    attributes: ['id', 'name', 'price', 'image'],
                },
            ],
        },
        // Только активные корзины
        active: {
            where: { status: CART_STATUS.ACTIVE },
        },
        // Брошенные корзины
        abandoned: {
            where: { status: CART_STATUS.ABANDONED },
        },
        // Истёкшие корзины
        expired: {
            where: { status: CART_STATUS.EXPIRED },
        },
        // Конвертированные корзины (оформлены в заказ)
        converted: {
            where: { status: CART_STATUS.CONVERTED },
        },
        // Корзины конкретного пользователя
        byUser: (userId: number) => ({
            where: { user_id: userId },
        }),
        // Гостевые корзины по session_id
        bySession: (sessionId: string) => ({
            where: { session_id: sessionId },
        }),
        // Корзины с промокодами
        withPromo: {
            where: { promo_code: { [Op.ne]: null } },
        },
        // Корзины истекающие скоро (по умолчанию 7 дней)
        expiringSoon: (
            days: number = CART_CONSTANTS.DEFAULT_EXPIRING_SOON_DAYS,
        ) => {
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + days);
            return {
                where: {
                    expired_at: {
                        [Op.between]: [today, futureDate],
                    },
                    status: CART_STATUS.ACTIVE,
                },
            };
        },
        // Корзины конкретного тенанта
        byTenant: (tenantId: number) => ({
            where: { tenant_id: tenantId },
        }),
    },
})
export class CartModel
    extends Model<CartModel, ICartCreationAttributes>
    implements ICartModel
{
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        comment: 'Tenant ID for multi-tenant isolation',
    })
    tenant_id!: number;

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'User ID for authenticated users cart',
    })
    user_id?: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        comment: 'Session ID for guest carts',
    })
    session_id?: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        defaultValue: CART_STATUS.ACTIVE,
        comment: 'Cart status: active, abandoned, converted, expired',
        validate: {
            isIn: {
                args: [Object.values(CART_STATUS)],
                msg: `Статус корзины должен быть: ${Object.values(CART_STATUS).join(', ')}`,
            },
        },
    })
    status!: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        comment: 'Cart expiration timestamp (30 days inactive)',
    })
    expired_at?: Date;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
        comment: 'Applied promo code',
    })
    promo_code?: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Discount amount from promo code',
    })
    discount!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total cart amount (including discount)',
    })
    total_amount!: number;

    @BelongsTo(() => UserModel)
    user?: UserModel;

    @BelongsToMany(() => ProductModel, {
        through: () => CartProductModel,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    products!: ProductModel[];

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'created_at',
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'updated_at',
    })
    declare updatedAt: Date;

    // ==================== LIFECYCLE МЕТОДЫ ====================

    /**
     * Проверка истёк ли срок корзины
     */
    isExpired(): boolean {
        if (!this.expired_at) {
            return false;
        }
        return new Date() > new Date(this.expired_at);
    }

    /**
     * Проверка активна ли корзина
     */
    isActive(): boolean {
        return this.status === CART_STATUS.ACTIVE && !this.isExpired();
    }

    /**
     * Проверка брошенная ли корзина
     */
    isAbandoned(): boolean {
        return this.status === CART_STATUS.ABANDONED;
    }

    /**
     * Проверка конвертирована ли корзина в заказ
     */
    isConverted(): boolean {
        return this.status === CART_STATUS.CONVERTED;
    }

    /**
     * Маркировка корзины как конвертированной в заказ
     */
    async markAsConverted(): Promise<void> {
        this.status = CART_STATUS.CONVERTED;
        await this.save();
    }

    /**
     * Маркировка корзины как брошенной
     */
    async markAsAbandoned(): Promise<void> {
        this.status = CART_STATUS.ABANDONED;
        await this.save();
    }

    /**
     * Маркировка корзины как истёкшей
     */
    async markAsExpired(): Promise<void> {
        this.status = CART_STATUS.EXPIRED;
        await this.save();
    }

    /**
     * Установка времени истечения корзины (30 дней от текущей даты)
     */
    setExpirationDate(
        days: number = CART_CONSTANTS.DEFAULT_EXPIRATION_DAYS,
    ): void {
        if (days <= 0) {
            throw new Error('Количество дней должно быть положительным числом');
        }
        if (!Number.isInteger(days)) {
            throw new Error('Количество дней должно быть целым числом');
        }
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);
        this.expired_at = expirationDate;
    }

    /**
     * Проверка истекает ли корзина скоро (по умолчанию 7 дней)
     */
    isExpiringSoon(
        days: number = CART_CONSTANTS.DEFAULT_EXPIRING_SOON_DAYS,
    ): boolean {
        if (!this.expired_at) {
            return false;
        }
        const today = new Date();
        const expirationDate = new Date(this.expired_at);
        const daysUntilExpiration =
            (expirationDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24);
        return daysUntilExpiration > 0 && daysUntilExpiration <= days;
    }

    // ==================== МЕТОДЫ ПЕРЕСЧЁТА СУММ ====================

    /**
     * Пересчёт total_amount на основе всех товаров в корзине
     * (использует DB aggregation для лучшей производительности)
     */
    async recalculateTotal(transaction?: Transaction): Promise<void> {
        // Используем DB aggregation вместо загрузки всех товаров
        const result = await CartProductModel.findOne({
            where: { cart_id: this.id },
            attributes: [
                [literal('COALESCE(SUM(price * quantity), 0)'), 'subtotal'],
            ],
            raw: true,
            transaction,
        });

        const subtotal = Number(
            (result as { subtotal: number } | null)?.subtotal || 0,
        );

        // Применяем скидку и убеждаемся что total_amount не отрицательный
        this.total_amount = Math.max(0, subtotal - Number(this.discount));

        await this.save({ transaction });
    }

    /**
     * Применение промокода и расчёт скидки
     */
    async applyPromoCode(
        code: string,
        discountAmount: number,
        transaction?: Transaction,
    ): Promise<void> {
        if (discountAmount < 0) {
            throw new Error('Сумма скидки не может быть отрицательной');
        }

        this.promo_code = code;
        this.discount = discountAmount;

        await this.recalculateTotal(transaction);
    }

    /**
     * Удаление промокода и пересчёт суммы
     */
    async removePromoCode(transaction?: Transaction): Promise<void> {
        this.promo_code = undefined;
        this.discount = 0;

        await this.recalculateTotal(transaction);
    }

    /**
     * Получение суммы корзины без скидки (subtotal)
     */
    async getSubtotal(): Promise<number> {
        const items = await CartProductModel.findAll({
            where: { cart_id: this.id },
        });

        return items.reduce((sum, item) => {
            return sum + Number(item.price) * item.quantity;
        }, 0);
    }

    /**
     * Получение финальной суммы (total_amount учитывает скидку)
     */
    get finalAmount(): number {
        return Number(this.total_amount);
    }

    // ==================== GETTERS И COMPUTED PROPERTIES ====================

    /**
     * Количество товаров в корзине
     */
    async getItemsCount(): Promise<number> {
        const count = await CartProductModel.sum('quantity', {
            where: { cart_id: this.id },
        });
        return count || 0;
    }

    /**
     * Проверка пустая ли корзина
     */
    async isEmpty(): Promise<boolean> {
        const count = await this.getItemsCount();
        return count === 0;
    }

    /**
     * Тип корзины (guest или authenticated)
     */
    get cartType(): 'guest' | 'authenticated' {
        return this.user_id ? 'authenticated' : 'guest';
    }

    /**
     * Проверка является ли корзина гостевой
     */
    get isGuest(): boolean {
        return !this.user_id && !!this.session_id;
    }

    /**
     * Проверка является ли корзина авторизованного пользователя
     */
    get isAuthenticated(): boolean {
        return !!this.user_id;
    }

    /**
     * Проверка есть ли примененный промокод
     */
    get hasPromoCode(): boolean {
        return !!this.promo_code && Number(this.discount) > 0;
    }

    /**
     * Получение процента скидки от subtotal
     */
    async getDiscountPercentage(): Promise<number> {
        const subtotal = await this.getSubtotal();
        if (subtotal === 0) {
            return 0;
        }
        return (Number(this.discount) / subtotal) * 100;
    }

    /**
     * Проверка превышает ли корзина указанную сумму
     */
    exceedsAmount(amount: number): boolean {
        return Number(this.total_amount) > amount;
    }

    /**
     * Конвертация корзины из гостевой в авторизованную
     */
    async convertToAuthenticated(
        userId: number,
        transaction?: Transaction,
    ): Promise<void> {
        this.user_id = userId;
        this.session_id = undefined;
        await this.save({ transaction });
    }

    /**
     * Очистка истёкших корзин (статический метод для cron jobs)
     * (использует bulk update для лучшей производительности)
     */
    static async cleanupExpiredCarts(tenantId?: number): Promise<number> {
        const where: {
            expired_at: { [Op.lt]: Date };
            status: { [Op.ne]: string };
            tenant_id?: number;
        } = {
            expired_at: { [Op.lt]: new Date() },
            status: { [Op.ne]: CART_STATUS.EXPIRED }, // Не обновлять уже истёкшие
        };

        if (tenantId) {
            where.tenant_id = tenantId;
        }

        // Используем bulk update вместо N отдельных операций
        const [affectedCount] = await CartModel.update(
            { status: CART_STATUS.EXPIRED },
            { where },
        );

        return affectedCount;
    }

    /**
     * Поиск брошенных корзин для ремаркетинга
     * (активные корзины с товарами, не обновлялись N дней)
     * (использует INNER JOIN для избежания N+1)
     */
    static async findAbandonedCarts(
        days: number = CART_CONSTANTS.DEFAULT_ABANDONED_DAYS,
        tenantId?: number,
    ): Promise<CartModel[]> {
        const abandonedDate = new Date();
        abandonedDate.setDate(abandonedDate.getDate() - days);

        const where: {
            status: string;
            updated_at: { [Op.lt]: Date };
            tenant_id?: number;
        } = {
            status: CART_STATUS.ACTIVE,
            updated_at: { [Op.lt]: abandonedDate },
        };

        if (tenantId) {
            where.tenant_id = tenantId;
        }

        // Используем INNER JOIN - автоматически фильтрует только непустые корзины
        const carts = await CartModel.findAll({
            where,
            include: [
                {
                    model: CartProductModel,
                    required: true, // INNER JOIN - только корзины с товарами
                    attributes: [], // Не загружаем данные, только проверяем существование
                },
            ],
        });

        return carts;
    }
}
