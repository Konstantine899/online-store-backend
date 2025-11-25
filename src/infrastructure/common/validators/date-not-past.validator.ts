import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Валидатор для проверки, что дата не в прошлом
 */
@ValidatorConstraint({ name: 'isDateNotPast', async: false })
export class IsDateNotPastConstraint implements ValidatorConstraintInterface {
    validate(value: string): boolean {
        if (!value || typeof value !== 'string') {
            return true; // Пропускаем, если значение отсутствует (опциональное поле)
        }

        try {
            const date = new Date(value);
            const now = new Date();

            // Сравниваем только дату, без времени (устанавливаем время в 00:00:00)
            const dateOnly = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
            );
            const nowOnly = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
            );

            return dateOnly >= nowOnly;
        } catch {
            return false; // Некорректная дата
        }
    }

    defaultMessage(): string {
        return 'Дата не может быть в прошлом';
    }
}

/**
 * Декоратор для проверки, что дата не в прошлом
 */
export function IsDateNotPast(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsDateNotPastConstraint,
        });
    };
}
