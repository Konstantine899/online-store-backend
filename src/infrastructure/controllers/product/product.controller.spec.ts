// Устанавливаем переменные окружения для тестов ДО импорта модулей
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.JWT_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.COOKIE_PARSER_SECRET_KEY = 'test_cookie_secret';
process.env.DATABASE_URL =
    'mysql://test_user:TestPass123!@127.0.0.1:3308/online_store_test';
process.env.NODE_ENV = 'test';

// Переменные для миграций из .test.env
process.env.TEST_MYSQL_USER = 'test_user';
process.env.TEST_MYSQL_PASSWORD = 'TestPass123!';
process.env.TEST_MYSQL_DATABASE = 'online_store_test';
process.env.TEST_MYSQL_HOST = '127.0.0.1';
process.env.TEST_MYSQL_PORT = '3308';
process.env.TEST_DIALECT = 'mysql';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { Sequelize } from 'sequelize-typescript';
import { execSync } from 'child_process';

describe('ProductController Pagination V2', () => {
    let app: INestApplication;
    let sequelize: Sequelize;

    beforeAll(async () => {
        // Автоматически запускаем миграции для тестовой БД
        try {
            console.log('🔄 Запуск миграций для тестовой БД...');
            execSync('npx sequelize-cli db:migrate --env test', {
                stdio: 'pipe', // Скрываем вывод для чистоты логов
                cwd: process.cwd(),
            });
            console.log('✅ Миграции успешно применены');
        } catch (error) {
            console.warn(
                '⚠️ Миграции не выполнены, используем sync:',
                error instanceof Error ? error.message : String(error),
            );
        }

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Получаем экземпляр Sequelize для работы с БД
        sequelize = moduleFixture.get<Sequelize>(Sequelize);

        // Fallback: если миграции не сработали, синхронизируем модели
        try {
            await sequelize.sync({ force: false });
        } catch (error) {
            console.warn(
                '⚠️ Sync не выполнен:',
                error instanceof Error ? error.message : String(error),
            );
        }
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('GET /product/list-v2', () => {
        it('должен возвращать продукты в новом формате { data, meta }', async () => {
            const response = await request(app.getHttpServer())
                .get('/product/list-v2')
                .query({ page: 1, size: 2 })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('должен корректно обрабатывать пагинацию', async () => {
            const response = await request(app.getHttpServer())
                .get('/product/list-v2')
                .query({ page: 2, size: 1 })
                .expect(200);

            expect(response.body.meta.currentPage).toBe(2);
            expect(response.body.meta.previousPage).toBe(1);
        });
    });

    describe('GET /product/brand/:brandId/list-v2', () => {
        it('должен возвращать продукты бренда в новом формате', async () => {
            const response = await request(app.getHttpServer())
                .get('/product/brand/1/list-v2')
                .query({ page: 1, size: 2 })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
        });
    });
});
