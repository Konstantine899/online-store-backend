import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

enum ErrorType {
    QUANTITY_LIMIT_EXCEEDED = 'QUANTITY_LIMIT_EXCEEDED',
    QUANTITY_TOO_LOW = 'QUANTITY_TOO_LOW',
    CART_STATUS_INVALID = 'CART_STATUS_INVALID',
    INVALID_PROMO_CODE = 'INVALID_PROMO_CODE',
    PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
    CART_NOT_FOUND = 'CART_NOT_FOUND',
    CART_OPERATION_ERROR = 'CART_OPERATION_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface ErrorInfo {
    readonly type: ErrorType;
    readonly statusCode: number;
    readonly name: string;
    readonly message: string;
    readonly suggestion: string;
}

interface CachedErrorInfo extends ErrorInfo {
    readonly timestamp: number;
    readonly ttl: number;
}

/**
 * Exception Filter для бизнес-логики корзины
 * Обрабатывает специфичные бизнес-ошибки (превышение лимитов, неактивные товары и т.д.)
 */
@Catch()
export class CartBusinessLogicExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(CartBusinessLogicExceptionFilter.name);

    // TTL кэш для результатов категоризации ошибок
    private readonly errorCache = new Map<string, CachedErrorInfo>();
    private readonly cacheMaxSize = 100;
    private readonly cacheTtlMs = 5 * 60 * 1000; // 5 минут
    private readonly performanceThresholdMs = 10; // Порог для логирования медленных операций

    // Конфигурация ошибок
    private readonly ERROR_CONFIG = {
        QUANTITY_LIMIT_EXCEEDED: {
            statusCode: HttpStatus.BAD_REQUEST,
            name: 'CartQuantityError',
            message: 'Превышено максимальное количество товара в корзине',
            suggestion:
                'Уменьшите количество товара до максимально допустимого (999 шт.)',
        },
        QUANTITY_TOO_LOW: {
            statusCode: HttpStatus.BAD_REQUEST,
            name: 'CartQuantityError',
            message: 'Количество товара слишком мало',
            suggestion: 'Увеличьте количество товара до минимума (1 шт.)',
        },
        CART_STATUS_INVALID: {
            statusCode: HttpStatus.BAD_REQUEST,
            name: 'CartStatusError',
            message: 'Корзина недоступна для изменений',
            suggestion: 'Создайте новую корзину или восстановите активную',
        },
        INVALID_PROMO_CODE: {
            statusCode: HttpStatus.BAD_REQUEST,
            name: 'PromoCodeError',
            message: 'Промокод недействителен или истек',
            suggestion: 'Проверьте правильность промокода и его срок действия',
        },
        PRODUCT_NOT_FOUND: {
            statusCode: HttpStatus.NOT_FOUND,
            name: 'ProductNotFoundError',
            message: 'Товар не найден или недоступен',
            suggestion: 'Выберите другой товар из каталога',
        },
        CART_NOT_FOUND: {
            statusCode: HttpStatus.NOT_FOUND,
            name: 'CartNotFoundError',
            message: 'Корзина не найдена',
            suggestion: 'Создайте новую корзину, добавив товар',
        },
        CART_OPERATION_ERROR: {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            name: 'CartOperationError',
            message: 'Произошла ошибка при работе с корзиной',
            suggestion: 'Попробуйте повторить операцию через несколько секунд',
        },
        UNKNOWN_ERROR: {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            name: 'UnknownError',
            message: 'Произошла неожиданная ошибка',
            suggestion: 'Обратитесь в службу поддержки',
        },
    } as const;

    // Паттерны для эффективного сопоставления ошибок
    private readonly ERROR_PATTERNS: Partial<Record<ErrorType, RegExp>> = {
        [ErrorType.QUANTITY_LIMIT_EXCEEDED]:
            /количество.*превышать|превышено.*количество/i,
        [ErrorType.QUANTITY_TOO_LOW]: /количество.*меньше|слишком мало/i,
        [ErrorType.CART_STATUS_INVALID]: /конвертирована|истекла/i,
        [ErrorType.INVALID_PROMO_CODE]: /промокод|недействителен/i,
        [ErrorType.PRODUCT_NOT_FOUND]: /товар.*найден/i,
        [ErrorType.CART_NOT_FOUND]: /корзин.*найдена/i,
    };

    // Маппинг операций для эффективного определения типа операции
    private readonly OPERATION_MAPPING = new Map([
        ['POST:/cart/append', 'add-to-cart'],
        ['PUT:/cart/increment', 'increment-item'],
        ['PUT:/cart/decrement', 'decrement-item'],
        ['DELETE:/cart/remove', 'remove-item'],
        ['DELETE:/cart/clear', 'clear-cart'],
        ['POST:/cart/promo', 'apply-promo-code'],
        ['DELETE:/cart/promo', 'remove-promo-code'],
        ['GET:/cart', 'get-cart'],
    ]);

    catch(exception: unknown, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const { url, path, method } = request;
        const correlationId =
            (request.headers['x-request-id'] as string) || 'unknown';

        // Определяем тип ошибки и формируем соответствующий ответ
        const errorInfo = this.categorizeError(exception, path);

        this.logger.error(`Cart business logic error occurred`, {
            method,
            url,
            path,
            errorType: errorInfo.type,
            errorMessage: errorInfo.message,
            correlationId,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            timestamp: new Date().toISOString(),
            stack: this.extractStack(exception),
        });

        const errorResponse = {
            statusCode: errorInfo.statusCode,
            url,
            path,
            name: errorInfo.name,
            message: errorInfo.message,
            timestamp: new Date().toISOString(),
            details: {
                module: 'cart',
                operation: this.extractOperation(method, path),
                errorType: errorInfo.type,
                suggestion: errorInfo.suggestion,
                correlationId,
            },
        };

        response.status(errorInfo.statusCode).json(errorResponse);
    }

    /**
     * Категоризирует ошибку и возвращает соответствующую информацию
     */
    private categorizeError(exception: unknown, path: string): ErrorInfo {
        const startTime = Date.now();

        // Валидация входных параметров
        if (!path || typeof path !== 'string') {
            path = 'unknown';
        }

        // Безопасное извлечение сообщения об ошибке
        let message = 'Неизвестная ошибка';
        if (exception && typeof exception === 'object') {
            if (
                'message' in exception &&
                typeof exception.message === 'string'
            ) {
                message = exception.message;
            } else if ('toString' in exception) {
                message = exception.toString();
            }
        }

        // Проверка TTL кэша (безопасное создание ключа)
        const safeMessage = message.replace(/[:|]/g, '_').substring(0, 200); // Ограничиваем длину и экранируем
        const cacheKey = `${safeMessage}:${path}`;
        const cached = this.errorCache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            // Обновляем timestamp для LRU
            this.updateCacheAccess(cacheKey, cached);
            return this.extractErrorInfo(cached);
        }

        // Удаляем истёкшие записи
        if (cached) {
            this.errorCache.delete(cacheKey);
        }

        const isCartPath = path.includes('/cart');

        let result: ErrorInfo;

        // Эффективное сопоставление ошибок с использованием регулярных выражений
        for (const [errorType, pattern] of Object.entries(
            this.ERROR_PATTERNS,
        )) {
            if (pattern.test(message)) {
                result = {
                    type: errorType as ErrorType,
                    ...this.ERROR_CONFIG[errorType as ErrorType],
                };
                this.cacheResult(cacheKey, result);
                return result;
            }
        }

        // Общие ошибки для cart endpoints
        if (isCartPath) {
            result = {
                type: ErrorType.CART_OPERATION_ERROR,
                ...this.ERROR_CONFIG[ErrorType.CART_OPERATION_ERROR],
            };
            this.cacheResult(cacheKey, result);
            return result;
        }

        // Для не-cart ошибок возвращаем общую информацию
        result = {
            type: ErrorType.UNKNOWN_ERROR,
            ...this.ERROR_CONFIG[ErrorType.UNKNOWN_ERROR],
        };
        this.cacheResult(cacheKey, result);

        // Логирование медленных операций
        const duration = Date.now() - startTime;
        if (duration > this.performanceThresholdMs) {
            this.logger.warn(`Slow error categorization`, {
                duration: `${duration}ms`,
                message: message.substring(0, 100), // Ограничиваем длину для логов
                path,
                threshold: `${this.performanceThresholdMs}ms`,
            });
        }

        return result;
    }

    /**
     * Извлекает тип операции из пути и метода
     */
    private extractOperation(method: string, path: string): string {
        if (!path.includes('/cart')) {
            return 'unknown';
        }

        // Пытаемся найти точное соответствие
        const exactKey = `${method}:${path}`;
        const exactMatch = this.OPERATION_MAPPING.get(exactKey);
        if (exactMatch) {
            return exactMatch;
        }

        // Поиск частичного соответствия для более гибкого маппинга
        for (const [key, operation] of this.OPERATION_MAPPING) {
            const [expectedMethod, expectedPath] = key.split(':');
            if (expectedMethod === method && path.includes(expectedPath)) {
                return operation;
            }
        }

        // Fallback для GET запросов к корзине
        if (method === 'GET' && path.includes('/cart')) {
            return 'get-cart';
        }

        return 'unknown';
    }

    /**
     * Проверяет валидность кэшированной записи по TTL
     */
    private isCacheValid(cached: CachedErrorInfo): boolean {
        const now = Date.now();
        return now - cached.timestamp < cached.ttl;
    }

    /**
     * Обновляет время последнего доступа для LRU
     */
    private updateCacheAccess(key: string, cached: CachedErrorInfo): void {
        const updated = { ...cached, timestamp: Date.now() };
        this.errorCache.set(key, updated);
    }

    /**
     * Извлекает ErrorInfo из CachedErrorInfo
     */
    private extractErrorInfo(cached: CachedErrorInfo): ErrorInfo {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { timestamp, ttl, ...errorInfo } = cached;
        return errorInfo;
    }

    /**
     * Кэширует результат категоризации ошибки с TTL
     */
    private cacheResult(key: string, result: ErrorInfo): void {
        // Очищаем истёкшие записи при достижении лимита
        if (this.errorCache.size >= this.cacheMaxSize) {
            this.cleanupExpiredEntries();

            // Если всё ещё переполнен, удаляем самую старую запись
            if (this.errorCache.size >= this.cacheMaxSize) {
                this.evictOldestEntry();
            }
        }

        const cached: CachedErrorInfo = {
            ...result,
            timestamp: Date.now(),
            ttl: this.cacheTtlMs,
        };

        this.errorCache.set(key, cached);
    }

    /**
     * Удаляет истёкшие записи из кэша
     */
    private cleanupExpiredEntries(): void {
        for (const [key, cached] of this.errorCache.entries()) {
            if (!this.isCacheValid(cached)) {
                this.errorCache.delete(key);
            }
        }
    }

    /**
     * Удаляет самую старую запись (LRU)
     */
    private evictOldestEntry(): void {
        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, cached] of this.errorCache.entries()) {
            if (cached.timestamp < oldestTime) {
                oldestTime = cached.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.errorCache.delete(oldestKey);
        }
    }

    /**
     * Очищает кэш (для тестирования или принудительного обновления)
     */
    public clearCache(): void {
        this.errorCache.clear();
    }

    /**
     * Безопасно извлекает stack trace из exception
     */
    private extractStack(exception: unknown): string | undefined {
        if (
            exception &&
            typeof exception === 'object' &&
            'stack' in exception
        ) {
            return typeof exception.stack === 'string'
                ? exception.stack
                : undefined;
        }
        return undefined;
    }

    /**
     * Возвращает статистику кэша
     */
    public getCacheStats(): {
        size: number;
        maxSize: number;
        ttlMs: number;
        expiredEntries: number;
    } {
        const expiredEntries = Array.from(this.errorCache.values()).filter(
            (cached) => !this.isCacheValid(cached),
        ).length;

        return {
            size: this.errorCache.size,
            maxSize: this.cacheMaxSize,
            ttlMs: this.cacheTtlMs,
            expiredEntries,
        };
    }
}
