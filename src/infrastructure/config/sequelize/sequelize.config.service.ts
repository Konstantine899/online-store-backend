import {
    BrandModel,
    CartModel,
    CartProductModel,
    CategoryModel,
    NotificationModel,
    NotificationTemplateModel,
    OrderItemModel,
    OrderModel,
    ProductModel,
    ProductPropertyModel,
    RatingModel,
    RefreshTokenModel,
    RoleModel,
    UserAddressModel,
    UserModel,
    UserRoleModel,
} from '@app/domain/models';
import { dbToken } from '@app/infrastructure/config/sequelize/db-token';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from '@nestjs/sequelize';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
    private readonly logger = new Logger(SequelizeConfigService.name);
    private readonly SLOW_QUERY_THRESHOLD_MS = 100; // Логировать запросы >100ms

    constructor(private readonly configService: ConfigService) {}

    /**
     * Custom SQL logger с timing метриками
     * Логирует только медленные запросы (>100ms) для оптимизации производительности
     */
    private sqlLogger(sql: string, timing?: number): void {
        // Пропускаем в test режиме (если не включен DEBUG_SQL)
        if (
            process.env.NODE_ENV === 'test' &&
            process.env.DEBUG_SQL !== 'true'
        ) {
            return;
        }

        // Логируем только если есть timing
        if (typeof timing !== 'number') {
            return;
        }

        // Логируем только медленные запросы
        if (timing < this.SLOW_QUERY_THRESHOLD_MS) {
            return;
        }

        // Truncate длинные SQL для читаемости логов
        const truncatedSql =
            sql.length > 500 ? `${sql.substring(0, 500)}... (truncated)` : sql;

        // Форматируем timing
        const timingMs = `${timing.toFixed(2)}ms`;

        // Логируем с уровнем warn для медленных запросов
        if (timing >= 1000) {
            // Очень медленные запросы (>1s) - ERROR level
            this.logger.error(
                `🔴 Very slow SQL query (${timingMs}): ${truncatedSql}`,
                'SlowQuery',
            );
        } else {
            // Медленные запросы (100ms-1s) - WARN level
            this.logger.warn(
                `🟡 Slow SQL query (${timingMs}): ${truncatedSql}`,
                'SlowQuery',
            );
        }
    }

    createSequelizeOptions(): SequelizeModuleOptions {
        const {
            sql: { dialect, host, port, username, password, database, logging },
        } = this.configService.get(dbToken);

        // Используем custom SQL logger с timing метриками
        const sqlLoggingFn = logging
            ? (sql: string, timing?: number): void =>
                  this.sqlLogger(sql, timing)
            : false;

        return {
            dialect,
            host,
            port,
            username,
            password,
            database,
            logging: sqlLoggingFn, // Custom logger с timing
            timezone: '+00:00', // Используем UTC для всех timestamp (критично для тестов и multi-region)
            models: [
                ProductModel,
                CategoryModel,
                BrandModel,
                ProductPropertyModel,
                UserModel,
                RoleModel,
                UserRoleModel,
                RefreshTokenModel,
                CartModel,
                CartProductModel,
                RatingModel,
                OrderModel,
                OrderItemModel,
                UserAddressModel,
                NotificationModel,
                NotificationTemplateModel,
            ],
            autoLoadModels: true,
            synchronize: false, // отключаю автосинхронизацию

            define: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_0900_ai_ci',
            },

            // Подавляем предупреждения в тестовом режиме (если не включен DEBUG)
            ...(process.env.NODE_ENV === 'test' &&
                process.env.DEBUG_SQL !== 'true' && {
                    logging: false,
                    benchmark: false,
                    logQueryParameters: false,
                }),
        };
    }
}
