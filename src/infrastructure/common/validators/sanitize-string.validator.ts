import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSanitizedString', async: false })
export class IsSanitizedStringConstraint
    implements ValidatorConstraintInterface
{
    validate(value: string): boolean {
        if (typeof value !== 'string') return false;

        // Удаляем лишние пробелы
        const trimmed = value.trim();

        // Проверяем, что строка не пустая после обрезки пробелов
        if (trimmed.length === 0) return false;

        // Проверяем на HTML теги (без флага g для корректной работы с test())
        if (/<[^>]*>/.test(trimmed)) return false;

        // Проверяем на подозрительные паттерны XSS
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i,
            /vbscript:/i,
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(trimmed)) return false;
        }

        return true;
    }

    defaultMessage() {
        return 'Строка содержит недопустимые символы или HTML теги.';
    }
}

export function IsSanitizedString(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsSanitizedStringConstraint,
        });
    };
}