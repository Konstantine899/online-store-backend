import { PromoCodeModel } from '@app/domain/models';
import { IPromoCodeRepository } from '@app/domain/repositories';
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';

/**
 * Репозиторий для работы с промокодами
 *
 * Реализует IPromoCodeRepository для доступа к таблице promo_codes.
 * Использует Sequelize scopes для фильтрации активных/валидных промокодов.
 */
@Injectable()
export class PromoCodeRepository implements IPromoCodeRepository {
    /**
     * Найти промокод по коду (case-insensitive)
     * @param code - код промокода
     * @returns промокод или null если не найден
     */
    public async findByCode(code: string): Promise<PromoCodeModel | null> {
        return PromoCodeModel.findOne({
            where: {
                code: {
                    [Op.iLike]: code, // Case-insensitive поиск (для PostgreSQL)
                },
            },
        });
    }

    /**
     * Найти промокод по ID
     * @param id - идентификатор промокода
     * @returns промокод или null если не найден
     */
    public async findById(id: number): Promise<PromoCodeModel | null> {
        return PromoCodeModel.findByPk(id);
    }

    /**
     * Создать новый промокод
     * @param data - данные промокода
     * @returns созданный промокод
     */
    public async create(data: {
        code: string;
        discount_type: 'PERCENT' | 'FIXED';
        discount_value: number;
        valid_from?: Date;
        valid_until?: Date | null;
        usage_limit?: number | null;
        min_purchase_amount?: number | null;
        is_active?: boolean;
    }): Promise<PromoCodeModel> {
        return PromoCodeModel.create(data);
    }

    /**
     * Инкремент счётчика использований промокода
     * @param id - идентификатор промокода
     * @returns обновлённый промокод
     */
    public async incrementUsageCount(id: number): Promise<PromoCodeModel> {
        const promoCode = await this.findById(id);

        if (!promoCode) {
            throw new Error(`PromoCode with id ${id} not found`);
        }

        await promoCode.incrementUsage();

        return promoCode;
    }

    /**
     * Деактивировать промокод (soft delete)
     * @param id - идентификатор промокода
     * @returns деактивированный промокод
     */
    public async deactivate(id: number): Promise<PromoCodeModel> {
        const promoCode = await this.findById(id);

        if (!promoCode) {
            throw new Error(`PromoCode with id ${id} not found`);
        }

        promoCode.is_active = false;
        await promoCode.save();

        return promoCode;
    }

    /**
     * Получить все активные промокоды
     * @returns список активных промокодов
     */
    public async findAllActive(): Promise<PromoCodeModel[]> {
        return PromoCodeModel.scope('active').findAll();
    }

    /**
     * Получить список валидных промокодов (активные + в пределах срока действия)
     * @returns список валидных промокодов
     */
    public async findAllValid(): Promise<PromoCodeModel[]> {
        return PromoCodeModel.scope('valid').findAll();
    }
}
