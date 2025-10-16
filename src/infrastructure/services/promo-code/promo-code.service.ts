import { IPromoCodeService } from '@app/domain/services';
import { PromoCodeRepository } from '@app/infrastructure/repositories';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Сервис для работы с промокодами
 *
 * Реализует IPromoCodeService для валидации, расчёта скидок и применения промокодов.
 *
 * Бизнес-логика:
 * 1. Проверка активности промокода (is_active)
 * 2. Проверка срока действия (valid_from, valid_until)
 * 3. Проверка лимита использований (usage_limit, usage_count)
 * 4. Проверка минимальной суммы заказа (min_purchase_amount)
 * 5. Расчёт скидки (PERCENT или FIXED)
 * 6. Инкремент счётчика использований после применения
 */
@Injectable()
export class PromoCodeService implements IPromoCodeService {
    private readonly logger = new Logger(PromoCodeService.name);

    constructor(private readonly promoCodeRepository: PromoCodeRepository) {}

    /**
     * Валидация промокода
     * @param code - код промокода
     * @param cartTotal - общая сумма корзины
     * @returns объект с результатом валидации и причиной ошибки
     */
    public async validatePromoCode(
        code: string,
        cartTotal: number,
    ): Promise<{
        isValid: boolean;
        discount: number;
        errorMessage?: string;
    }> {
        this.logger.log(
            `Validating promo code: ${code}, cartTotal: ${cartTotal}`,
        );

        // Поиск промокода в БД (case-insensitive)
        const promoCode = await this.promoCodeRepository.findByCode(code);

        if (!promoCode) {
            return {
                isValid: false,
                discount: 0,
                errorMessage: 'Промокод не найден',
            };
        }

        // Проверка активности
        if (!promoCode.is_active) {
            return {
                isValid: false,
                discount: 0,
                errorMessage: 'Промокод неактивен',
            };
        }

        // Проверка срока действия
        if (!promoCode.hasStarted()) {
            return {
                isValid: false,
                discount: 0,
                errorMessage: 'Промокод ещё не начал действовать',
            };
        }

        if (promoCode.isExpired()) {
            return {
                isValid: false,
                discount: 0,
                errorMessage: 'Срок действия промокода истёк',
            };
        }

        // Проверка лимита использований
        if (promoCode.hasReachedLimit()) {
            return {
                isValid: false,
                discount: 0,
                errorMessage: 'Достигнут лимит использований промокода',
            };
        }

        // Проверка минимальной суммы покупки
        if (!promoCode.meetsMinimumPurchase(cartTotal)) {
            const minAmount = Number(promoCode.min_purchase_amount);
            return {
                isValid: false,
                discount: 0,
                errorMessage: `Минимальная сумма покупки для этого промокода: ${minAmount} руб.`,
            };
        }

        // Расчёт скидки
        const discount = promoCode.calculateDiscount(cartTotal);

        this.logger.log(
            `Promo code ${code} is valid. Discount: ${discount} (type: ${promoCode.discount_type}, value: ${promoCode.discount_value})`,
        );

        return {
            isValid: true,
            discount,
        };
    }

    /**
     * Применить промокод (инкремент счётчика использования)
     * @param code - код промокода
     */
    public async applyPromoCode(code: string): Promise<void> {
        this.logger.log(`Applying promo code: ${code}`);

        const promoCode = await this.promoCodeRepository.findByCode(code);

        if (!promoCode) {
            throw new Error(`PromoCode with code "${code}" not found`);
        }

        await this.promoCodeRepository.incrementUsageCount(promoCode.id);

        this.logger.log(
            `Promo code ${code} applied successfully. Usage count: ${promoCode.usage_count + 1}`,
        );
    }
}
