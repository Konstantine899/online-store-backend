import { IMappingRules } from '@app/domain/models';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { Injectable } from '@nestjs/common';

/**
 * Результат оценки правила маппинга
 */
export interface IMappingRuleEvaluationResult {
    /** Совпало ли правило */
    matched: boolean;
    /** ID роли для применения (если совпало) */
    roleId?: number | null;
    /** Название роли для применения (если совпало) */
    roleName?: string | null;
    /** Какое условие сработало */
    matchedCondition?: {
        if: Record<string, unknown>;
        then: string | number;
    };
}

/**
 * Контекст для оценки правил маппинга
 */
export interface IMappingEvaluationContext {
    /** Название внешней роли */
    externalRoleName: string;
    /** Атрибуты пользователя из SSO профиля (department, location и т.д.) */
    userAttributes?: Record<string, unknown>;
}

/**
 * MappingRuleEngine - Движок для оценки правил маппинга ролей
 *
 * Поддерживает:
 * - Простые условия (прямое сравнение значений)
 * - Операторы: $eq, $ne, $in, $contains, $startsWith, $endsWith
 * - Вложенные условия: $and, $or (будущая функциональность)
 *
 * Пример использования:
 * ```typescript
 * const engine = new MappingRuleEngine();
 * const result = engine.evaluate(
 *   {
 *     conditions: [
 *       { if: { department: 'IT', external_role: 'admin' }, then: 5 },
 *       { if: { department: 'Sales' }, then: 3 }
 *     ],
 *     default: 1
 *   },
 *   {
 *     externalRoleName: 'admin',
 *     userAttributes: { department: 'IT', location: 'Moscow' }
 *   }
 * );
 * ```
 */
@Injectable()
export class MappingRuleEngine {
    private readonly logger = createLogger('MappingRuleEngine');

    /** Максимальная длина паттерна для строковых операторов (защита от ReDoS) */
    private readonly MAX_PATTERN_LENGTH = 1000;

    /**
     * Оценить правила маппинга и вернуть подходящую роль
     * @param mappingRules - Правила маппинга
     * @param context - Контекст оценки (внешняя роль, атрибуты пользователя)
     * @returns Результат оценки или null, если ничего не совпало
     */
    public evaluate(
        mappingRules: IMappingRules | null,
        context: IMappingEvaluationContext,
    ): IMappingRuleEvaluationResult | null {
        if (!mappingRules) {
            return null;
        }

        // Оцениваем условия по порядку
        if (mappingRules.conditions && mappingRules.conditions.length > 0) {
            for (const condition of mappingRules.conditions) {
                if (!condition.if || !condition.then) {
                    continue;
                }

                const matches = this.evaluateCondition(condition.if, context);

                if (matches) {
                    this.logger.debug(
                        {
                            condition: condition.if,
                            context,
                        },
                        'Mapping rule condition matched',
                    );

                    // Парсим результат (может быть ID роли или название)
                    const roleInfo = this.parseRoleIdentifier(condition.then);

                    return {
                        matched: true,
                        roleId: roleInfo.roleId,
                        roleName: roleInfo.roleName,
                        matchedCondition: condition,
                    };
                }
            }
        }

        // Если ни одно условие не совпало, проверяем default
        if (mappingRules.default !== undefined) {
            const roleInfo = this.parseRoleIdentifier(mappingRules.default);

            this.logger.debug(
                {
                    default: mappingRules.default,
                    context,
                },
                'Using default role from mapping rules',
            );

            return {
                matched: true,
                roleId: roleInfo.roleId,
                roleName: roleInfo.roleName,
            };
        }

        return null;
    }

    /**
     * Оценить одно условие (if)
     * @param condition - Условие для проверки
     * @param context - Контекст оценки
     * @returns true если условие выполнено
     */
    private evaluateCondition(
        condition: Record<string, unknown>,
        context: IMappingEvaluationContext,
    ): boolean {
        // Если условие пустое, оно не считается совпавшим
        if (Object.keys(condition).length === 0) {
            return false;
        }

        // Проверяем все ключи условия
        for (const [key, expectedValue] of Object.entries(condition)) {
            // Специальные ключи-операторы
            if (key.startsWith('$')) {
                if (key === '$and' || key === '$or') {
                    // Будущая функциональность для вложенных условий
                    this.logger.warn(
                        { operator: key },
                        'Nested operators ($and, $or) not yet implemented',
                    );
                    continue;
                }

                // Обрабатываем операторы
                if (!this.evaluateOperator(key, expectedValue, context)) {
                    return false;
                }
                continue;
            }

            // Стандартная проверка: ключ = значение
            const actualValue = this.getValueFromContext(key, context);

            // Если значение не найдено, условие не выполнено
            if (actualValue === undefined) {
                return false;
            }

            // Сравниваем значения
            if (!this.compareValues(actualValue, expectedValue)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Получить значение из контекста по ключу
     * @param key - Ключ для поиска
     * @param context - Контекст оценки
     * @returns Значение или undefined
     */
    private getValueFromContext(
        key: string,
        context: IMappingEvaluationContext,
    ): unknown {
        // Специальный ключ для внешней роли
        if (key === 'external_role' || key === 'externalRoleName') {
            return context.externalRoleName;
        }

        // Ищем в атрибутах пользователя
        if (context.userAttributes) {
            return context.userAttributes[key];
        }

        return undefined;
    }

    /**
     * Сравнить два значения (с поддержкой операторов)
     * @param actual - Фактическое значение
     * @param expected - Ожидаемое значение (может содержать операторы)
     * @returns true если значения совпадают
     */
    private compareValues(actual: unknown, expected: unknown): boolean {
        // Если expected - объект с оператором
        if (typeof expected === 'object' && expected !== null) {
            const expectedObj = expected as Record<string, unknown>;

            // Проверяем операторы
            if ('$eq' in expectedObj) {
                return actual === expectedObj.$eq;
            }
            if ('$ne' in expectedObj) {
                return actual !== expectedObj.$ne;
            }
            if ('$in' in expectedObj) {
                const arr = expectedObj.$in as unknown[];
                return Array.isArray(arr) && arr.includes(actual);
            }
            if ('$contains' in expectedObj) {
                if (
                    typeof actual === 'string' &&
                    typeof expectedObj.$contains === 'string'
                ) {
                    const pattern = expectedObj.$contains;
                    if (pattern.length > this.MAX_PATTERN_LENGTH) {
                        this.logger.warn(
                            {
                                patternLength: pattern.length,
                                maxLength: this.MAX_PATTERN_LENGTH,
                            },
                            'Pattern too long for $contains operator',
                        );
                        return false;
                    }
                    return actual.includes(pattern);
                }
                return false;
            }
            if ('$startsWith' in expectedObj) {
                if (
                    typeof actual === 'string' &&
                    typeof expectedObj.$startsWith === 'string'
                ) {
                    const pattern = expectedObj.$startsWith;
                    if (pattern.length > this.MAX_PATTERN_LENGTH) {
                        this.logger.warn(
                            {
                                patternLength: pattern.length,
                                maxLength: this.MAX_PATTERN_LENGTH,
                            },
                            'Pattern too long for $startsWith operator',
                        );
                        return false;
                    }
                    return actual.startsWith(pattern);
                }
                return false;
            }
            if ('$endsWith' in expectedObj) {
                if (
                    typeof actual === 'string' &&
                    typeof expectedObj.$endsWith === 'string'
                ) {
                    const pattern = expectedObj.$endsWith;
                    if (pattern.length > this.MAX_PATTERN_LENGTH) {
                        this.logger.warn(
                            {
                                patternLength: pattern.length,
                                maxLength: this.MAX_PATTERN_LENGTH,
                            },
                            'Pattern too long for $endsWith operator',
                        );
                        return false;
                    }
                    return actual.endsWith(pattern);
                }
                return false;
            }
        }

        // Простое сравнение
        return actual === expected;
    }

    /**
     * Оценить оператор верхнего уровня ($and, $or и т.д.)
     * @param operator - Оператор
     * @param value - Значение оператора
     * @param _context - Контекст (зарезервировано для будущей реализации)
     * @returns true если оператор выполнен
     */
    private evaluateOperator(
        operator: string,
        value: unknown,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _context: IMappingEvaluationContext,
    ): boolean {
        // Пока не реализовано, возвращаем false
        this.logger.warn(
            { operator, value },
            'Top-level operators not yet implemented',
        );
        return false;
    }

    /**
     * Парсить идентификатор роли (может быть ID или название)
     * @param identifier - ID роли (число) или название роли (строка)
     * @returns Объект с roleId и roleName
     */
    private parseRoleIdentifier(identifier: string | number): {
        roleId: number | null;
        roleName: string | null;
    } {
        if (typeof identifier === 'number') {
            return {
                roleId: identifier,
                roleName: null,
            };
        }

        if (typeof identifier === 'string') {
            // Если строка - это число, парсим как ID
            const parsed = Number.parseInt(identifier, 10);
            if (!Number.isNaN(parsed)) {
                return {
                    roleId: parsed,
                    roleName: null,
                };
            }

            // Иначе это название роли
            return {
                roleId: null,
                roleName: identifier,
            };
        }

        return {
            roleId: null,
            roleName: null,
        };
    }
}
