import { RoleModel, UserModel } from '@app/domain/models';
import { CreateUserDto } from '@app/infrastructure/dto';
import { INestApplication } from '@nestjs/common';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';

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
     * @returns userId, email, password, id нового пользователя
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
    ): Promise<{
        userId: number;
        email: string;
        password: string;
        id: number;
    }> {
        this.userCounter++;
        const email = overrides.email || this.uniqueEmail();
        const password = overrides.password || 'TestPass123!';
        const passwordHash = await hash(password, 10);
        const phone = overrides.phone || this.uniquePhone();

        // Находим роль с retry logic (для параллельных тестов)
        const roleName = overrides.role || 'USER';
        let role = await RoleModel.findOne({ where: { role: roleName } });

        // Retry до 3 раз с экспоненциальной задержкой (для race conditions в parallel tests)
        if (!role) {
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 100 * attempt),
                );
                role = await RoleModel.findOne({ where: { role: roleName } });
                if (role) break;
            }
        }

        if (!role) {
            throw new Error(`Role ${roleName} not found in database after ${3} retries`);
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

        return { userId: user.id, email, password, id: user.id };
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
    ): Promise<{
        userId: number;
        email: string;
        password: string;
        token: string;
        user: { userId: number; email: string };
    }> {
        const sequelize = app.get(Sequelize);
        const { userId, email, password } = await this.createUserInDB(
            sequelize,
            { ...overrides, role },
        );

        const token = await this.loginUser(app, email, password);

        return {
            userId,
            email,
            password,
            token,
            user: { userId, email },
        };
    }

    /**
     * Создаёт токен сброса пароля в БД
     * Используется для тестирования password reset flow
     *
     * @param sequelize - Sequelize instance
     * @param userId - ID пользователя
     * @param options - опции токена (expired, used)
     * @returns { token, tokenId }
     */
    static async createPasswordResetToken(
        sequelize: Sequelize,
        userId: number,
        options: {
            expired?: boolean;
            used?: boolean;
            tenantId?: number;
            ipAddress?: string;
            userAgent?: string;
        } = {},
    ): Promise<{ token: string; tokenId: number }> {
        const token = randomBytes(32).toString('hex'); // 64 hex chars
        const now = new Date();

        // Expired: expiresAt в прошлом
        const expiresAt = options.expired
            ? new Date(now.getTime() - 60 * 60 * 1000) // 1 час назад
            : new Date(now.getTime() + 15 * 60 * 1000); // +15 минут

        // Used: isUsed = true, usedAt = now
        const isUsed = options.used || false;
        const usedAt = options.used ? now : null;

        const [result] = await sequelize.query(
            `INSERT INTO password_reset_tokens
            (user_id, tenant_id, token, expires_at, is_used, used_at, ip_address, user_agent, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            {
                replacements: [
                    userId,
                    options.tenantId || null,
                    token,
                    expiresAt.toISOString().slice(0, 19).replace('T', ' '), // MySQL datetime format
                    isUsed,
                    usedAt
                        ? usedAt.toISOString().slice(0, 19).replace('T', ' ')
                        : null,
                    options.ipAddress || '127.0.0.1',
                    options.userAgent || 'test-agent',
                ],
            },
        );

        // MySQL возвращает insertId в result
        const tokenId = (result as any).insertId || (result as any);

        return { token, tokenId };
    }

    /**
     * Создаёт пользователя и валидный токен сброса пароля
     * Helper для тестов password reset flow
     *
     * @param app - NestJS application
     * @returns { userId, email, password, token }
     */
    static async createUserWithPasswordResetToken(
        app: INestApplication,
    ): Promise<{
        userId: number;
        email: string;
        password: string;
        token: string;
    }> {
        const sequelize = app.get(Sequelize);

        // Создаём пользователя
        const { userId, email, password } = await this.createUserInDB(
            sequelize,
            {},
        );

        // Создаём валидный токен
        const { token } = await this.createPasswordResetToken(
            sequelize,
            userId,
            {},
        );

        return { userId, email, password, token };
    }
}
