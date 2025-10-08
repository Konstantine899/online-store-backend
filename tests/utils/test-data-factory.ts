import { CreateUserDto } from '@app/infrastructure/dto';

/**
 * TestDataFactory - генерация уникальных тестовых данных
 *
 * Назначение:
 * - Предотвращение race conditions через уникальные данные
 * - Избежание конфликтов unique constraints
 * - DRY принцип для тестовых данных
 *
 * Использование:
 * ```typescript
 * const email = TestDataFactory.uniqueEmail();
 * const phone = TestDataFactory.uniquePhone();
 * const userDto = TestDataFactory.createUserDto({ firstName: 'Иван' });
 * ```
 */
export class TestDataFactory {
    /**
     * Генерирует уникальный email адрес
     * Формат: test.user.{timestamp}.{random}@test.com
     */
    static uniqueEmail(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `test.user.${timestamp}.${random}@test.com`;
    }

    /**
     * Генерирует уникальный российский телефон
     * Формат: +799XXXXXXXXX (валидный для @IsValidPhone)
     */
    static uniquePhone(): string {
        const timestamp = Date.now().toString().slice(-9); // Последние 9 цифр
        return `+799${timestamp}`;
    }

    /**
     * Создает DTO для создания пользователя с уникальными данными
     * @param overrides - переопределение полей
     */
    static createUserDto(
        overrides: Partial<CreateUserDto> = {},
    ): CreateUserDto {
        return {
            email: this.uniqueEmail(),
            password: 'SecurePass123!',
            ...overrides,
        } as CreateUserDto;
    }

    /**
     * Генерирует случайное имя для тестов
     */
    static randomFirstName(): string {
        const names = [
            'Иван',
            'Петр',
            'Сергей',
            'Алексей',
            'Михаил',
            'Дмитрий',
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    /**
     * Генерирует случайную фамилию для тестов
     */
    static randomLastName(): string {
        const names = ['Иванов', 'Петров', 'Сидoров', 'Смирнов', 'Кузнецов'];
        return names[Math.floor(Math.random() * names.length)];
    }

    /**
     * Генерирует уникальный адрес
     */
    static createAddress(overrides = {}) {
        return {
            title: `Адрес ${Date.now()}`,
            street: 'ул. Тестовая',
            house: String(Math.floor(Math.random() * 100) + 1),
            city: 'Москва',
            country: 'Россия',
            ...overrides,
        };
    }
}
