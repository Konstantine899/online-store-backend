import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Валидатор для проверки размера объекта metadata
 * Проверяет, что объект не слишком большой (по количеству ключей и глубине вложенности)
 */
@ValidatorConstraint({ name: 'isValidMetadataSize', async: false })
export class IsValidMetadataSizeConstraint
    implements ValidatorConstraintInterface
{
    private readonly MAX_KEYS = 20;
    private readonly MAX_DEPTH = 3;
    private readonly MAX_STRING_LENGTH = 1000;

    validate(value: unknown): boolean {
        if (!value || typeof value !== 'object') {
            return true; // Пропускаем, если значение отсутствует (опциональное поле)
        }

        const metadata = value as Record<string, unknown>;

        // Проверяем количество ключей
        const keys = Object.keys(metadata);
        if (keys.length > this.MAX_KEYS) {
            return false;
        }

        // Проверяем глубину вложенности и размер строк
        return this.validateObject(metadata, 0);
    }

    private validateObject(obj: unknown, depth: number): boolean {
        if (depth > this.MAX_DEPTH) {
            return false;
        }

        if (typeof obj === 'string') {
            return obj.length <= this.MAX_STRING_LENGTH;
        }

        if (typeof obj !== 'object' || obj === null) {
            return true; // Примитивные типы (кроме строк) разрешены
        }

        if (Array.isArray(obj)) {
            // Для массивов проверяем каждый элемент
            return obj.every((item) => this.validateObject(item, depth + 1));
        }

        // Для объектов проверяем каждое значение
        const record = obj as Record<string, unknown>;
        return Object.values(record).every((value) =>
            this.validateObject(value, depth + 1),
        );
    }

    defaultMessage(): string {
        return `metadata не может содержать более ${this.MAX_KEYS} ключей, глубина вложенности не более ${this.MAX_DEPTH} уровней, строки не более ${this.MAX_STRING_LENGTH} символов`;
    }
}

/**
 * Декоратор для проверки размера объекта metadata
 */
export function IsValidMetadataSize(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidMetadataSizeConstraint,
        });
    };
}
