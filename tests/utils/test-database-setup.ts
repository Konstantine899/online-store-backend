import { execSync } from 'child_process';

/**
 * TestDatabaseSetup - настройка БД для интеграционных тестов
 * 
 * Применяет миграции и seeds для тестовой БД перед запуском тестов.
 * Обеспечивает наличие всех необходимых таблиц и данных.
 */
export class TestDatabaseSetup {
    /**
     * Применяет миграции для тестовой БД
     * @param env - окружение (по умолчанию 'test')
     */
    static async applyMigrations(env: string = 'test'): Promise<void> {
        try {
            execSync(`npx sequelize-cli db:migrate --env ${env}`, { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
            console.log(`✅ Migrations applied for ${env} environment`);
        } catch (error) {
            console.warn(`⚠️  Migration warning for ${env}:`, error.message);
            // Не бросаем ошибку - миграции могут быть уже применены
        }
    }

    /**
     * Применяет seeds для тестовой БД
     * @param env - окружение (по умолчанию 'test')
     */
    static async applySeeds(env: string = 'test'): Promise<void> {
        try {
            execSync(`npx sequelize-cli db:seed:all --env ${env}`, { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
            console.log(`✅ Seeds applied for ${env} environment`);
        } catch (error) {
            console.warn(`⚠️  Seed warning for ${env}:`, error.message);
            // Не бросаем ошибку - seeds могут быть уже применены
        }
    }

    /**
     * Полная настройка БД: миграции + seeds
     * @param env - окружение (по умолчанию 'test')
     */
    static async setupDatabase(env: string = 'test'): Promise<void> {
        await this.applyMigrations(env);
        await this.applySeeds(env);
    }

    /**
     * Сбрасывает БД (удаляет все данные и применяет миграции заново)
     * @param env - окружение (по умолчанию 'test')
     */
    static async resetDatabase(env: string = 'test'): Promise<void> {
        try {
            // Удаляем все таблицы
            execSync(`npx sequelize-cli db:drop --env ${env}`, { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
        } catch (error) {
            console.warn(`⚠️  Drop warning for ${env}:`, error.message);
        }

        try {
            // Создаем БД заново
            execSync(`npx sequelize-cli db:create --env ${env}`, { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
        } catch (error) {
            console.warn(`⚠️  Create warning for ${env}:`, error.message);
        }

        // Применяем миграции и seeds
        await this.setupDatabase(env);
    }
}
