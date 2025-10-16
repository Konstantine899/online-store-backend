import { Op } from 'sequelize';
import {
    Column,
    CreatedAt,
    DataType,
    Model,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';

interface IPromoCodeModel {
    id: number;
    code: string;
    discount_type: 'PERCENT' | 'FIXED';
    discount_value: number;
    valid_from: Date;
    valid_until: Date | null;
    usage_limit: number | null;
    usage_count: number;
    min_purchase_amount: number | null;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface IPromoCodeCreationAttributes {
    code: string;
    discount_type?: 'PERCENT' | 'FIXED';
    discount_value: number;
    valid_from?: Date;
    valid_until?: Date | null;
    usage_limit?: number | null;
    usage_count?: number;
    min_purchase_amount?: number | null;
    is_active?: boolean;
}

@Table({
    tableName: 'promo_codes',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        // Активные промокоды
        active: {
            where: {
                is_active: true,
            },
        },
        // Валидные промокоды (активные + в пределах срока действия)
        valid: () => {
            const now = new Date();
            return {
                where: {
                    is_active: true,
                    valid_from: { [Op.lte]: now },
                    [Op.or]: [
                        { valid_until: null },
                        { valid_until: { [Op.gte]: now } },
                    ],
                },
            };
        },
        // Промокоды с неограниченным использованием
        unlimited: {
            where: {
                usage_limit: null,
            },
        },
        // Промокоды с ограничением использования
        limited: {
            where: {
                usage_limit: { [Op.ne]: null },
            },
        },
    },
})
export class PromoCodeModel
    extends Model<PromoCodeModel, IPromoCodeCreationAttributes>
    implements IPromoCodeModel
{
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique promo code (case-insensitive)',
    })
    code!: string;

    @Column({
        type: DataType.ENUM('PERCENT', 'FIXED'),
        allowNull: false,
        defaultValue: 'PERCENT',
        comment: 'Discount type: PERCENT (%) or FIXED (currency)',
    })
    discount_type!: 'PERCENT' | 'FIXED';

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Discount value (percentage or fixed amount)',
    })
    discount_value!: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        comment: 'Promo code valid from date',
    })
    valid_from!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        comment: 'Promo code valid until date (NULL = no expiration)',
    })
    valid_until!: Date | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'Maximum number of uses (NULL = unlimited)',
    })
    usage_limit!: number | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Current number of uses',
    })
    usage_count!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Minimum purchase amount required (0 or NULL = no minimum)',
    })
    min_purchase_amount!: number | null;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Is promo code active (soft delete)',
    })
    is_active!: boolean;

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

    // ==================== МЕТОДЫ ВАЛИДАЦИИ ====================

    /**
     * Проверка валидности промокода
     * @returns true если промокод активен, в пределах срока действия и не превысил лимит использований
     */
    isValid(): boolean {
        if (!this.is_active) {
            return false;
        }

        const now = new Date();

        // Проверка срока действия
        if (this.valid_from > now) {
            return false;
        }

        if (this.valid_until && this.valid_until < now) {
            return false;
        }

        // Проверка лимита использований
        if (this.usage_limit && this.usage_count >= this.usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Проверка минимальной суммы покупки
     * @param purchaseAmount - сумма покупки
     * @returns true если сумма покупки соответствует минимальному требованию
     */
    meetsMinimumPurchase(purchaseAmount: number): boolean {
        if (!this.min_purchase_amount) {
            return true;
        }
        return purchaseAmount >= this.min_purchase_amount;
    }

    /**
     * Расчёт суммы скидки
     * @param totalAmount - общая сумма корзины
     * @returns сумма скидки
     */
    calculateDiscount(totalAmount: number): number {
        if (this.discount_type === 'PERCENT') {
            // Процентная скидка
            return (totalAmount * Number(this.discount_value)) / 100;
        } else {
            // Фиксированная скидка (не больше суммы корзины)
            return Math.min(Number(this.discount_value), totalAmount);
        }
    }

    /**
     * Инкремент счётчика использований
     */
    async incrementUsage(): Promise<void> {
        this.usage_count += 1;
        await this.save();
    }

    /**
     * Проверка истёк ли срок действия промокода
     */
    isExpired(): boolean {
        if (!this.valid_until) {
            return false;
        }
        return new Date() > this.valid_until;
    }

    /**
     * Проверка начал ли действовать промокод
     */
    hasStarted(): boolean {
        return new Date() >= this.valid_from;
    }

    /**
     * Проверка достиг ли промокод лимита использований
     */
    hasReachedLimit(): boolean {
        if (!this.usage_limit) {
            return false;
        }
        return this.usage_count >= this.usage_limit;
    }

    /**
     * Получение оставшегося количества использований
     */
    getRemainingUses(): number | null {
        if (!this.usage_limit) {
            return null; // Unlimited
        }
        return Math.max(0, this.usage_limit - this.usage_count);
    }

    /**
     * Проверка является ли скидка процентной
     */
    isPercentDiscount(): boolean {
        return this.discount_type === 'PERCENT';
    }

    /**
     * Проверка является ли скидка фиксированной
     */
    isFixedDiscount(): boolean {
        return this.discount_type === 'FIXED';
    }
}
