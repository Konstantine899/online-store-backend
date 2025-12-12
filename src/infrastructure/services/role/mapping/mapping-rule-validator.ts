import { Injectable } from '@nestjs/common';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { IMappingRules } from '@app/domain/models';

/**
 * Результат валидации правил маппинга
 */
export interface IMappingRuleValidationResult {
    /** Валидны ли правила */
    valid: boolean;
    /** Ошибки валидации */
    errors: string[];
}

/**
 * MappingRuleValidator - Валидатор правил маппинга ролей
 *
 * Проверяет:
 * - Структуру JSON
 * - Обязательные поля
 * - Типы значений
 * - Корректность операторов
 * - Глубину вложенности (защита от циклов)
 */
@Injectable()
export class MappingRuleValidator {
    private readonly logger = createLogger('MappingRuleValidator');

    /** Максимальная глубина вложенности условий */
    private readonly MAX_DEPTH = 5;

    /** Поддерживаемые операторы */
    private readonly SUPPORTED_OPERATORS = [
        '$eq',
        '$ne',
        '$in',
        '$contains',
        '$startsWith',
        '$endsWith',
    ];

    /**
     * Валидировать правила маппинга
     * @param mappingRules - Правила для валидации
     * @returns Результат валидации
     */
    public validate(
        mappingRules: IMappingRules | null | undefined,
    ): IMappingRuleValidationResult {
        const errors: string[] = [];

        // null разрешен (правила необязательны)
        if (mappingRules === null || mappingRules === undefined) {
            return { valid: true, errors: [] };
        }

        // Проверяем базовую структуру
        if (typeof mappingRules !== 'object') {
            errors.push('Правила маппинга должны быть объектом');
            return { valid: false, errors };
        }

        // Валидируем conditions (если есть)
        if (mappingRules.conditions !== undefined) {
            const conditionsErrors = this.validateConditions(
                mappingRules.conditions,
            );
            errors.push(...conditionsErrors);
        }

        // Валидируем default (если есть)
        if (mappingRules.default !== undefined) {
            const defaultErrors = this.validateDefaultRole(
                mappingRules.default,
            );
            errors.push(...defaultErrors);
        }

        const valid = errors.length === 0;

        if (!valid) {
            this.logger.warn(
                { errors, mappingRules },
                'Mapping rules validation failed',
            );
        }

        return {
            valid,
            errors,
        };
    }

    /**
     * Валидировать массив условий
     * @param conditions - Массив условий
     * @returns Массив ошибок
     */
    private validateConditions(
        conditions: Array<{ if: Record<string, unknown>; then: string | number }> | undefined,
    ): string[] {
        const errors: string[] = [];

        if (conditions === undefined) {
            return errors;
        }

        if (!Array.isArray(conditions)) {
            errors.push('Поле conditions должно быть массивом');
            return errors;
        }

        if (conditions.length === 0) {
            // Пустой массив разрешен
            return errors;
        }

        // Проверяем каждое условие
        conditions.forEach((condition, index) => {
            if (typeof condition !== 'object' || condition === null) {
                errors.push(
                    `Условие #${index + 1} должно быть объектом`,
                );
                return;
            }

            // Проверяем наличие поля 'if'
            if (!condition.if) {
                errors.push(`Условие #${index + 1} должно содержать поле 'if'`);
            } else if (typeof condition.if !== 'object') {
                errors.push(
                    `Поле 'if' в условии #${index + 1} должно быть объектом`,
                );
            } else {
                // Валидируем структуру условия
                const conditionErrors = this.validateConditionStructure(
                    condition.if,
                    `condition[${index}]`,
                );
                errors.push(...conditionErrors);
            }

            // Проверяем наличие поля 'then'
            if (condition.then === undefined || condition.then === null) {
                errors.push(`Условие #${index + 1} должно содержать поле 'then'`);
            } else if (
                typeof condition.then !== 'string' &&
                typeof condition.then !== 'number'
            ) {
                errors.push(
                    `Поле 'then' в условии #${index + 1} должно быть строкой или числом`,
                );
            }
        });

        return errors;
    }

    /**
     * Валидировать структуру условия (if)
     * @param condition - Условие
     * @param path - Путь для сообщений об ошибках
     * @param depth - Текущая глубина вложенности
     * @returns Массив ошибок
     */
    private validateConditionStructure(
        condition: Record<string, unknown>,
        path: string,
        depth = 0,
    ): string[] {
        const errors: string[] = [];

        if (depth > this.MAX_DEPTH) {
            errors.push(
                `${path}: Превышена максимальная глубина вложенности условий (${this.MAX_DEPTH})`,
            );
            return errors;
        }

        // Проверяем все ключи условия
        for (const [key, value] of Object.entries(condition)) {
            // Специальные операторы верхнего уровня
            if (key.startsWith('$')) {
                if (key === '$and' || key === '$or') {
                    errors.push(
                        `${path}.${key}: Вложенные операторы ($and, $or) пока не поддерживаются`,
                    );
                    continue;
                }

                if (!this.SUPPORTED_OPERATORS.includes(key)) {
                    errors.push(
                        `${path}.${key}: Неподдерживаемый оператор. Поддерживаемые: ${this.SUPPORTED_OPERATORS.join(', ')}`,
                    );
                }
                continue;
            }

            // Обычные поля или операторы внутри значения
            if (value !== null && typeof value === 'object') {
                // Проверяем, не является ли это объектом с оператором
                const valueObj = value as Record<string, unknown>;
                const operatorKeys = Object.keys(valueObj).filter((k) =>
                    k.startsWith('$'),
                );

                if (operatorKeys.length > 0) {
                    // Валидируем операторы внутри значения
                    operatorKeys.forEach((operatorKey) => {
                        if (
                            !this.SUPPORTED_OPERATORS.includes(operatorKey)
                        ) {
                            errors.push(
                                `${path}.${key}.${operatorKey}: Неподдерживаемый оператор`,
                            );
                        } else {
                            // Валидируем значение оператора
                            const operatorValue = valueObj[operatorKey];
                            const operatorErrors = this.validateOperatorValue(
                                operatorKey,
                                operatorValue,
                                `${path}.${key}.${operatorKey}`,
                            );
                            errors.push(...operatorErrors);
                        }
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Валидировать значение оператора
     * @param operator - Оператор
     * @param value - Значение оператора
     * @param path - Путь для сообщений об ошибках
     * @returns Массив ошибок
     */
    private validateOperatorValue(
        operator: string,
        value: unknown,
        path: string,
    ): string[] {
        const errors: string[] = [];

        switch (operator) {
            case '$eq':
            case '$ne':
                // Может быть любое значение
                break;

            case '$in':
                if (!Array.isArray(value)) {
                    errors.push(
                        `${path}: Оператор $in требует массив значений`,
                    );
                }
                break;

            case '$contains':
            case '$startsWith':
            case '$endsWith':
                if (typeof value !== 'string') {
                    errors.push(
                        `${path}: Оператор ${operator} требует строковое значение`,
                    );
                }
                break;

            default:
                errors.push(`${path}: Неизвестный оператор ${operator}`);
        }

        return errors;
    }

    /**
     * Валидировать default роль
     * @param defaultRole - Default роль (ID или название)
     * @returns Массив ошибок
     */
    private validateDefaultRole(
        defaultRole: string | number | undefined,
    ): string[] {
        const errors: string[] = [];

        if (defaultRole === undefined || defaultRole === null) {
            return errors;
        }

        if (
            typeof defaultRole !== 'string' &&
            typeof defaultRole !== 'number'
        ) {
            errors.push(
                'Поле default должно быть строкой (название роли) или числом (ID роли)',
            );
        }

        if (
            typeof defaultRole === 'number' &&
            (Number.isNaN(defaultRole) || defaultRole < 1)
        ) {
            errors.push(
                'ID роли в поле default должен быть положительным числом',
            );
        }

        if (typeof defaultRole === 'string' && defaultRole.trim().length === 0) {
            errors.push('Название роли в поле default не может быть пустым');
        }

        return errors;
    }
}

