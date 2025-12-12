/**
 * Валидатор параметров пагинации (Defence in depth)
 * SAAS-003: Используется в репозиториях для санитизации входных данных перед SQL запросами
 *
 * @example
 * ```typescript
 * const validSort = PaginationValidator.validateSort(sort);
 * const safeLimit = PaginationValidator.validateLimit(limit);
 * const safeOffset = PaginationValidator.validateOffset(offset);
 * ```
 */
export class PaginationValidator {
    /**
     * Валидирует и санитизирует параметр сортировки
     * @param sort - направление сортировки (ASC/DESC)
     * @param defaultSort - значение по умолчанию (по умолчанию 'DESC')
     * @returns валидное значение 'ASC' | 'DESC'
     */
    static validateSort(
        sort: string,
        defaultSort: 'ASC' | 'DESC' = 'DESC',
    ): 'ASC' | 'DESC' {
        return ['ASC', 'DESC'].includes(sort?.toUpperCase())
            ? (sort.toUpperCase() as 'ASC' | 'DESC')
            : defaultSort;
    }

    /**
     * Валидирует и ограничивает лимит записей
     * @param limit - количество записей на странице
     * @param defaultLimit - значение по умолчанию (по умолчанию 5)
     * @param maxLimit - максимальное значение (по умолчанию 100)
     * @returns валидный лимит в диапазоне [1, maxLimit]
     */
    static validateLimit(
        limit: number,
        defaultLimit = 5,
        maxLimit = 100,
    ): number {
        const value = limit ?? defaultLimit; // использовать defaultLimit только для null/undefined
        return Math.max(1, Math.min(value, maxLimit));
    }

    /**
     * Валидирует offset (смещение)
     * @param offset - смещение записей
     * @returns валидный offset >= 0
     */
    static validateOffset(offset: number): number {
        return Math.max(0, offset ?? 0);
    }
}
