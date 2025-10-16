import { DataTypes, Model, Op, Sequelize } from 'sequelize';
import { PromoCodeCreationAttributes, PromoCodeModel } from './types';

class PromoCode
    extends Model<PromoCodeModel, PromoCodeCreationAttributes>
    implements PromoCodeModel
{
    declare id: number;
    declare code: string;
    declare discount_type: 'PERCENT' | 'FIXED';
    declare discount_value: number;
    declare valid_from: Date;
    declare valid_until: Date | null;
    declare usage_limit: number | null;
    declare usage_count: number;
    declare min_purchase_amount: number | null;
    declare is_active: boolean;
    declare created_at: Date;
    declare updated_at: Date;

    /**
     * Проверка валидности промокода
     * @returns true если промокод активен, в пределах срока действия и не превысил лимит использований
     */
    public isValid(): boolean {
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
    public meetsMinimumPurchase(purchaseAmount: number): boolean {
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
    public calculateDiscount(totalAmount: number): number {
        if (this.discount_type === 'PERCENT') {
            // Процентная скидка
            return (totalAmount * this.discount_value) / 100;
        } else {
            // Фиксированная скидка
            return Math.min(this.discount_value, totalAmount);
        }
    }

    /**
     * Инкремент счётчика использований
     */
    public async incrementUsage(): Promise<void> {
        this.usage_count += 1;
        await this.save();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    static associate(models: Record<string, any>): void {
        // PromoCode не имеет прямых связей с другими таблицами
        // Связь с корзиной осуществляется через поле promo_code в таблице cart
    }
}

export default function definePromoCode(
    sequelize: Sequelize,
): typeof PromoCode {
    PromoCode.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            discount_type: {
                type: DataTypes.ENUM('PERCENT', 'FIXED'),
                allowNull: false,
                defaultValue: 'PERCENT',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            discount_value: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            valid_from: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            valid_until: {
                type: DataTypes.DATE,
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            usage_limit: {
                type: DataTypes.INTEGER,
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            usage_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            min_purchase_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
            modelName: 'promo_code',
            tableName: 'promo_codes',
            timestamps: true,
            underscored: true,
            scopes: {
                // Scope для активных промокодов
                active: {
                    where: {
                        is_active: true,
                    },
                },
                // Scope для валидных промокодов (активные + в пределах срока действия)
                valid: {
                    where: {
                        is_active: true,
                        valid_from: {
                            [Op.lte]: new Date(),
                        },
                        [Op.or]: [
                            { valid_until: null },
                            {
                                valid_until: {
                                    [Op.gte]: new Date(),
                                },
                            },
                        ],
                    },
                },
            },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return PromoCode;
}
