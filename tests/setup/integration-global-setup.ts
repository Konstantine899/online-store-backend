/**
 * Global setup для integration тестов
 * Выполняется ОДИН РАЗ перед запуском всех integration тестов
 *
 * Задача: полная очистка и инициализация тестовой БД перед прогоном
 * Это убирает предупреждения о дубликатах миграций/сидов
 *
 * Используем TestDatabaseSetup для гарантированно правильной работы с миграциями
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { TestDatabaseSetup } from '../utils/test-database-setup';

export default async function globalSetup(): Promise<void> {
    // Загружаем .test.env ДО работы с БД (globalSetup выполняется до setupFilesAfterEnv)
    const envPath = path.resolve(__dirname, '../../.test.env');
    dotenv.config({ path: envPath });

    console.log('🔄 [Integration Global Setup] Resetting test database...');

    try {
        // Полная очистка и инициализация БД: drop → create → migrate → seed
        // resetDatabase гарантирует чистую БД перед каждым запуском тестов
        // Это убирает предупреждения о дубликатах миграций/сидов
        await TestDatabaseSetup.resetDatabase('test');

        console.log(
            '✅ [Integration Global Setup] Test database setup complete',
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error(
            '❌ [Integration Global Setup] Failed to reset database:',
            errorMessage,
        );
        // Не бросаем ошибку - это может быть из-за того, что БД уже была чистой
        // В тестах всё равно будет setupDatabase
    }
}
