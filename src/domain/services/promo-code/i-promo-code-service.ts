/**
 * Интерфейс сервиса промокодов
 *
 * Предоставляет методы для:
 * - Валидации промокодов
 * - Расчёта скидок
 * - Применения промокодов к корзине
 * - Управления использованием промокодов
 */
export interface IPromoCodeService {
    /**
     * Валидация промокода
     * @param code - код промокода
     * @param cartTotal - общая сумма корзины
     * @returns объект с результатом валидации и причиной ошибки
     */
    validatePromoCode(
        code: string,
        cartTotal: number,
    ): Promise<{
        isValid: boolean;
        discount: number;
        errorMessage?: string;
    }>;

    /**
     * Применить промокод (инкремент счётчика использования)
     * @param code - код промокода
     */
    applyPromoCode(code: string): Promise<void>;
}
