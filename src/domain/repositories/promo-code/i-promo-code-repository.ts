import { PromoCodeModel } from '@app/domain/models';

/**
 * Интерфейс репозитория промокодов
 *
 * Предоставляет методы для работы с промокодами в БД:
 * - Поиск промокодов по коду и ID
 * - Создание новых промокодов
 * - Обновление счётчика использований
 * - Удаление (деактивация) промокодов
 */
export interface IPromoCodeRepository {
    /**
     * Найти промокод по коду (case-insensitive)
     * @param code - код промокода
     * @returns промокод или null если не найден
     */
    findByCode(code: string): Promise<PromoCodeModel | null>;

    /**
     * Найти промокод по ID
     * @param id - идентификатор промокода
     * @returns промокод или null если не найден
     */
    findById(id: number): Promise<PromoCodeModel | null>;

    /**
     * Создать новый промокод
     * @param data - данные промокода
     * @returns созданный промокод
     */
    create(data: {
        code: string;
        discount_type: 'PERCENT' | 'FIXED';
        discount_value: number;
        valid_from?: Date;
        valid_until?: Date | null;
        usage_limit?: number | null;
        min_purchase_amount?: number | null;
        is_active?: boolean;
    }): Promise<PromoCodeModel>;

    /**
     * Инкремент счётчика использований промокода
     * @param id - идентификатор промокода
     * @returns обновлённый промокод
     */
    incrementUsageCount(id: number): Promise<PromoCodeModel>;

    /**
     * Деактивировать промокод (soft delete)
     * @param id - идентификатор промокода
     * @returns деактивированный промокод
     */
    deactivate(id: number): Promise<PromoCodeModel>;

    /**
     * Получить все активные промокоды
     * @returns список активных промокодов
     */
    findAllActive(): Promise<PromoCodeModel[]>;

    /**
     * Получить список валидных промокодов (активные + в пределах срока действия)
     * @returns список валидных промокодов
     */
    findAllValid(): Promise<PromoCodeModel[]>;
}
