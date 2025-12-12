import {
    cleanPhoneNumber,
    isRussianPhoneFormat,
    PHONE_CONSTANTS,
} from '@app/infrastructure/common/utils/phone.utils';
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidPhone', async: false })
export class IsValidPhoneConstraint implements ValidatorConstraintInterface {
    validate(phone: string): boolean {
        // Ранний выход для невалидных типов
        if (typeof phone !== 'string' || phone.trim().length === 0) {
            return false;
        }

        // Ранний выход для явно слишком коротких/длинных номеров
        if (
            phone.length < PHONE_CONSTANTS.MIN_INTERNATIONAL_LENGTH ||
            phone.length > PHONE_CONSTANTS.MAX_FORMATTED_LENGTH
        ) {
            return false;
        }

        // Отклоняем строки с буквами и множественными '+'
        if (/[A-Za-zА-Яа-яЁё]/.test(phone)) {
            return false;
        }
        if ((phone.match(/\+/g) ?? []).length > 1) {
            return false;
        }

        // Проверяем, что нет запрещенных спецсимволов (разрешены только: +, цифры, пробелы, дефисы, скобки)
        if (/[^\d+\s\-()]/.test(phone)) {
            return false;
        }

        // Удаляем все нецифровые символы (пробелы, дефисы, скобки) для проверки формата
        const cleanPhone = cleanPhoneNumber(phone);

        // Проверка российских номеров: 11 цифр, начинается с 7 или 8
        if (isRussianPhoneFormat(cleanPhone)) {
            return true;
        }

        // Проверка международного формата: начинается с +, затем 7-15 цифр
        const normalized = phone.replace(/[\s\-()]/g, '');
        if (normalized.startsWith('+')) {
            const digits = normalized.replace(/^\+/, '');
            if (/^[0-9]+$/.test(digits)) {
                return (
                    digits.length >= PHONE_CONSTANTS.MIN_INTERNATIONAL_LENGTH &&
                    digits.length <= PHONE_CONSTANTS.MAX_INTERNATIONAL_LENGTH
                );
            }
        }

        // Если не российский и не международный формат - отклоняем
        return false;
    }
    defaultMessage(): string {
        return 'Номер телефона должен быть в формате: +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX или международный формат';
    }
}

export function IsValidPhone(validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string): void =>
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidPhoneConstraint,
        });
}
