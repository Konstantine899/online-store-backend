import { IMappingRules } from '@app/domain/models';
import { MappingRuleValidator } from '@app/infrastructure/services/role/mapping/mapping-rule-validator';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Валидатор для mapping rules
 * Использует MappingRuleValidator для проверки структуры правил маппинга
 */
@ValidatorConstraint({ name: 'isValidMappingRules', async: false })
export class IsValidMappingRulesConstraint
    implements ValidatorConstraintInterface
{
    private readonly validator = new MappingRuleValidator();

    validate(value: unknown): boolean {
        // null разрешен (правила необязательны)
        if (value === null || value === undefined) {
            return true;
        }

        // Проверяем, что это объект
        if (typeof value !== 'object') {
            return false;
        }

        // Валидируем через MappingRuleValidator
        const result = this.validator.validate(value as IMappingRules);

        return result.valid;
    }

    defaultMessage(args: ValidationArguments): string {
        const value = args.value;

        // Если значение не объект
        if (
            value !== null &&
            value !== undefined &&
            typeof value !== 'object'
        ) {
            return 'Правила маппинга должны быть объектом или null';
        }

        // Если значение null/undefined, но это не разрешено
        // (этот случай не должен возникнуть, так как мы разрешаем null)
        if (value === null || value === undefined) {
            return 'Правила маппинга не могут быть пустыми';
        }

        // Валидируем и возвращаем детальные ошибки
        const validator = new MappingRuleValidator();
        const result = validator.validate(value as IMappingRules);

        if (!result.valid && result.errors.length > 0) {
            // Возвращаем первую ошибку или все ошибки через точку с запятой
            return result.errors.join('; ');
        }

        return 'Правила маппинга содержат ошибки';
    }
}

/**
 * Декоратор для валидации mapping rules
 * @param validationOptions - Опции валидации
 * @returns Декоратор
 */
export function IsValidMappingRules(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return function (object: object, propertyName: string | symbol) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName as string,
            options: validationOptions,
            constraints: [],
            validator: IsValidMappingRulesConstraint,
        });
    };
}
