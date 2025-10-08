import { CreateUserDto } from '@app/infrastructure/dto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';
import { UserModel, RoleModel } from '@app/domain/models';

/**
 * TestDataFactory - генерация уникальных тестовых данных
 *
 * Назначение:
 * - Предотвращение race conditions через уникальные данные
 * - Избежание конфликтов unique constraints
 * - DRY принцип для тестовых данных
 * - Создание полноценных пользователей в БД для тестов
 *
 * Использование:
 * ```typescript
 * // Простые уникальные данные
 * const email = TestDataFactory.uniqueEmail();
 * const phone = TestDataFactory.uniquePhone();
 *
 * // Создание пользователя в БД + получение токена
 * const { user, token } = await TestDataFactory.createAuthenticatedUser(app);
 * // ... используем в тестах ...
 * // Cleanup автоматически удалит user.id > 14
 * ```
 */
export class TestDataFactory {
    private static userCounter = 0;
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

    /**
     * Создаёт пользователя напрямую в БД (быстрее чем через API)
     * Используется когда не нужна полная регистрация
     * 
     * @param sequelize - Sequelize instance
     * @param overrides - переопределение полей
     * @returns userId нового пользователя
     */
    static async createUserInDB(
        sequelize: Sequelize,
        overrides: Partial<{
            email: string;
            password: string;
            phone: string;
            firstName: string;
            lastName: string;
            role: string;
        }> = {},
    ): Promise<{ userId: number; email: string; password: string }> {
        this.userCounter++;
        const email = overrides.email || this.uniqueEmail();
        const password = overrides.password || 'TestPass123!';
        const passwordHash = await hash(password, 10);
        const phone = overrides.phone || this.uniquePhone();

        // Находим роль
        const roleName = overrides.role || 'USER';
        const role = await RoleModel.findOne({ where: { role: roleName } });

        if (!role) {
            throw new Error(`Role ${roleName} not found in database`);
        }

        // Создаём пользователя через Sequelize Model (безопаснее чем raw SQL)
        const user = await UserModel.create({
            email,
            password: passwordHash,
            phone,
            firstName: overrides.firstName || null,
            lastName: overrides.lastName || null,
            isActive: true,
            isVerified: true,
            isEmailVerified: true,
        } as any);

        // Присваиваем роль через прямую вставку (избегаем проблем с $add)
        await sequelize.query(
            `INSERT INTO user_role (user_id, role_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
            {
                replacements: [user.id, role.id],
            },
        );

        return { userId: user.id, email, password };
    }

    /**
     * Создаёт пользователя через API /registration и возвращает access token
     * Полный цикл регистрации (как настоящий пользователь)
     * 
     * @param app - NestJS application
     * @param overrides - переопределение полей DTO
     * @returns { email, password, accessToken, userId }
     */
    static async createAuthenticatedUser(
        app: INestApplication,
        overrides: Partial<CreateUserDto> = {},
    ): Promise<{
        email: string;
        password: string;
        accessToken: string;
        userId?: number;
    }> {
        const dto = this.createUserDto(overrides);

        const response = await request(app.getHttpServer())
            .post('/online-store/auth/registration')
            .send(dto)
            .expect(201);

        if (!response.body.accessToken) {
            throw new Error(
                `Failed to get token during registration: ${JSON.stringify(response.body)}`,
            );
        }

        return {
            email: dto.email,
            password: dto.password,
            accessToken: response.body.accessToken,
        };
    }

    /**
     * Логинит существующего пользователя и возвращает токен
     * 
     * @param app - NestJS application
     * @param email - email пользователя
     * @param password - пароль пользователя
     * @returns accessToken
     */
    static async loginUser(
        app: INestApplication,
        email: string,
        password: string,
    ): Promise<string> {
        const response = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send({ email, password })
            .expect(200);

        if (!response.body.accessToken) {
            throw new Error(
                `Failed to login user ${email}: ${JSON.stringify(response.body)}`,
            );
        }

        return response.body.accessToken;
    }

    /**
     * Создаёт пользователя в БД с определённой ролью и возвращает токен
     * Комбинация createUserInDB + loginUser для быстрых тестов
     * 
     * @param app - NestJS application
     * @param role - роль пользователя (USER, ADMIN, и т.д.)
     * @param overrides - переопределение полей
     */
    static async createUserWithRole(
        app: INestApplication,
        role: string = 'USER',
        overrides: Partial<{
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        }> = {},
    ): Promise<{ userId: number; email: string; password: string; token: string }> {
        const sequelize = app.get(Sequelize);
        const { userId, email, password } = await this.createUserInDB(
            sequelize,
            { ...overrides, role },
        );

        const token = await this.loginUser(app, email, password);

        return { userId, email, password, token };
    }
}
