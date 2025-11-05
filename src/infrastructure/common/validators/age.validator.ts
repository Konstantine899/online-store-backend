import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Минимальный возраст для регистрации (18 лет)
 */
const MIN_AGE = 18;

/**
 * Максимальный разумный возраст (150 лет)
 */
const MAX_AGE = 150;

/**
 * Валидатор возраста: проверяет, что дата рождения соответствует возрасту 18+
 */
@ValidatorConstraint({ name: 'isValidAge', async: false })
export class IsValidAgeConstraint implements ValidatorConstraintInterface {
    validate(dateOfBirth: string | Date): boolean {
        if (!dateOfBirth) {
            return false;
        }

        const date =
            typeof dateOfBirth === 'string'
                ? new Date(dateOfBirth)
                : dateOfBirth;

        // Проверяем, что дата валидна
        if (isNaN(date.getTime())) {
            return false;
        }

        // Нормализуем дату (убираем время, оставляем только дату)
        const normalizedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
        );

        // Проверяем, что дата не в будущем
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (normalizedDate > today) {
            return false;
        }

        // Вычисляем возраст
        const age = this.calculateAge(normalizedDate, today);

        // Проверяем, что возраст >= 18 и <= 150
        return age >= MIN_AGE && age <= MAX_AGE;
    }

    /**
     * Вычисляет возраст на основе даты рождения и текущей даты
     */
    private calculateAge(birthDate: Date, currentDate: Date): number {
        // Нормализуем даты (убираем время, оставляем только дату)
        const birth = new Date(
            birthDate.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate(),
        );
        const current = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
        );

        let age = current.getFullYear() - birth.getFullYear();
        const monthDiff = current.getMonth() - birth.getMonth();

        // Если день рождения еще не наступил в этом году, уменьшаем возраст на 1
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && current.getDate() < birth.getDate())
        ) {
            age--;
        }

        return age;
    }

    defaultMessage(): string {
        return `Дата рождения должна соответствовать возрасту от ${MIN_AGE} до ${MAX_AGE} лет`;
    }
}

/**
 * Декоратор для валидации возраста (18+)
 * Проверяет, что дата рождения соответствует возрасту от 18 до 150 лет
 * и что дата не в будущем
 */
export function IsValidAge(validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string): void =>
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidAgeConstraint,
        });
}
