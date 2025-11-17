import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware для замера времени выполнения HTTP запросов
 * Логирует запросы, превышающие пороговые значения
 * - WARNING: > 500ms
 * - ERROR: > 1000ms
 */
@Injectable()
export class QueryPerformanceMiddleware implements NestMiddleware {
    private readonly logger = new Logger(QueryPerformanceMiddleware.name);

    // Пороговые значения (в миллисекундах)
    private readonly WARNING_THRESHOLD = 500; // 500ms
    private readonly ERROR_THRESHOLD = 1000; // 1000ms

    use(req: Request, res: Response, next: NextFunction): void {
        const start = Date.now();
        const method = req.method;
        const originalUrl = req.originalUrl;

        // Перехватываем завершение ответа
        res.on('finish', () => {
            const duration = Date.now() - start;
            const statusCode = res.statusCode;

            // Извлекаем correlation ID из заголовков (если есть)
            const correlationId = req.headers['x-request-id'] ?? 'unknown';

            const logContext = {
                method,
                url: originalUrl,
                statusCode,
                duration: `${duration}ms`,
                correlationId,
            };

            // Логируем только медленные запросы
            if (duration >= this.ERROR_THRESHOLD) {
                this.logger.error(
                    `🔴 Очень медленный запрос (>${this.ERROR_THRESHOLD}ms)`,
                    logContext,
                );
            } else if (duration >= this.WARNING_THRESHOLD) {
                this.logger.warn(
                    `🟡 Медленный запрос (>${this.WARNING_THRESHOLD}ms)`,
                    logContext,
                );
            }

            // Дополнительно логируем успешные быстрые запросы на уровне debug
            // (можно отключить в production)
            if (
                duration < this.WARNING_THRESHOLD &&
                process.env.NODE_ENV !== 'production'
            ) {
                this.logger.debug(
                    `✅ Быстрый запрос (<${this.WARNING_THRESHOLD}ms)`,
                    logContext,
                );
            }
        });

        next();
    }
}
