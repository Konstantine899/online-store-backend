import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Валидатор для проверки структуры translations: Record<string, string>
 *
 * Правила:
 * - Ключи: формат namespace.key (lowercase, цифры, подчеркивания), длина 3-100 символов
 * - Значения: строки, длина 1-1000 символов
 * - Максимум 100 записей
 */
@ValidatorConstraint({ name: 'IsValidTranslations', async: false })
export class IsValidTranslationsConstraint
    implements ValidatorConstraintInterface
{
    validate(translations: unknown): boolean | Promise<boolean> {
        // Если не передано - валидно (это optional поле)
        if (translations === undefined || translations === null) {
            return true;
        }

        // Должно быть объектом
        if (typeof translations !== 'object' || Array.isArray(translations)) {
            return false;
        }

        const translationsObj = translations as Record<string, unknown>;
        const entries = Object.entries(translationsObj);

        // Максимум 100 записей
        if (entries.length > 100) {
            return false;
        }

        // Валидация каждой записи
        const keyPattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

        for (const [key, value] of entries) {
            // Ключ: формат namespace.key, длина 3-100
            if (
                typeof key !== 'string' ||
                key.length < 3 ||
                key.length > 100 ||
                !keyPattern.test(key)
            ) {
                return false;
            }

            // Значение: строка, длина 1-1000
            if (
                typeof value !== 'string' ||
                value.length < 1 ||
                value.length > 1000
            ) {
                return false;
            }
        }

        return true;
    }

    defaultMessage(args: ValidationArguments): string {
        const translations = args.value as Record<string, unknown> | undefined;

        if (!translations) {
            return 'Переводы должны быть объектом';
        }

        if (Array.isArray(translations)) {
            return 'Переводы должны быть объектом, а не массивом';
        }

        const entries = Object.entries(translations);

        if (entries.length > 100) {
            return 'Максимальное количество переводов: 100';
        }

        const keyPattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

        for (const [key, value] of entries) {
            if (typeof key !== 'string') {
                return 'Ключ перевода должен быть строкой';
            }

            if (key.length < 3 || key.length > 100) {
                return `Ключ перевода должен быть длиной от 3 до 100 символов (проблема: "${key}")`;
            }

            if (!keyPattern.test(key)) {
                return `Ключ перевода должен быть в формате namespace.key (только lowercase, цифры и подчеркивания): "${key}"`;
            }

            if (typeof value !== 'string') {
                return `Значение перевода для ключа "${key}" должно быть строкой`;
            }

            if (value.length < 1 || value.length > 1000) {
                return `Значение перевода для ключа "${key}" должно быть длиной от 1 до 1000 символов`;
            }
        }

        return 'Некорректная структура переводов';
    }
}

/**
 * Декоратор для валидации персональных переводов пользователя
 *
 * @example
 * ```typescript
 * class UpdateUserPreferencesDto {
 *   @IsValidTranslations({ message: 'Некорректная структура переводов' })
 *   translations?: Record<string, string>;
 * }
 * ```
 */
export function IsValidTranslations(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return function (object: object, propertyKey: string | symbol): void {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyKey as string,
            options: validationOptions,
            constraints: [],
            validator: IsValidTranslationsConstraint,
        });
    };
}
