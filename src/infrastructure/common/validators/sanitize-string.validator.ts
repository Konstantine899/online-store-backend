import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSanitizedString', async: false })
export class IsSanitizedStringConstraint implements ValidatorConstraintInterface {
    validate(value: string) {
        if (typeof value !== 'string') return false;

        // Удаляем HTML теги
        const sanitized = value.replace(/<[^>]*>/g, '');
        
        // Удаляем лишние пробелы
        const trimmed = sanitized.trim();
        
        // Проверяем, что строка не пустая после санитизации
        if (trimmed.length === 0) return false;

        // Проверяем на подозрительные символы (базовая защита от XSS)
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i,
            /vbscript:/i
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