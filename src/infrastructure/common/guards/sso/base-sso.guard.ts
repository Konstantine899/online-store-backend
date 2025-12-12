import {
    type ExecutionContext,
    HttpException,
    UnauthorizedException,
} from '@nestjs/common';

/**
 * Интерфейс для расширенных ошибок Passport с statusCode
 */
export interface IPassportError extends Error {
    statusCode?: number;
    response?: unknown;
}

/**
 * Базовый класс для SSO Guards
 * Содержит общую логику обработки ошибок из Passport
 *
 * Наследники должны:
 * - Наследоваться от AuthGuard(strategyName) и использовать BaseSSOGuard через композицию
 * - Переопределить getStateParameterName() - имя параметра state (для сообщений об ошибках)
 *
 * @note Используем композицию для совместимости с @nestjs/passport
 * AuthGuard - это фабрика, которая возвращает класс, поэтому используем композицию вместо наследования
 */
export abstract class BaseSSOGuard {
    /**
     * Получить имя параметра state для сообщений об ошибках
     * @protected
     */
    protected abstract getStateParameterName(): string;

    /**
     * Переопределяем handleRequest для правильной обработки ошибок из Passport
     * Ошибки с statusCode преобразуются в соответствующие HttpException
     */
    handleRequest<TUser = unknown>(
        err: Error | null,
        user: TUser,
        info: Error | string | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _context: ExecutionContext,
    ): TUser {
        // Если есть ошибка, обрабатываем её
        if (err) {
            // КРИТИЧНО: Обрабатываем специфическую ошибку "Cannot read properties of undefined (reading 'error')"
            // которая может возникнуть при проблемах с Passport стратегией
            const errorMessage = err.message || String(err);
            if (
                errorMessage.includes(
                    "Cannot read properties of undefined (reading 'error')",
                ) ||
                (errorMessage.includes('reading') &&
                    errorMessage.includes('error') &&
                    errorMessage.includes('undefined'))
            ) {
                // Это ошибка конфигурации стратегии - возвращаем понятное сообщение
                throw new UnauthorizedException(
                    `Ошибка аутентификации: ${this.getStateParameterName()} отсутствует в callback`,
                );
            }

            // Проверяем, есть ли statusCode в ошибке (из convertToPassportError)
            const passportError = err as IPassportError;
            if (passportError.statusCode) {
                throw new HttpException(
                    passportError.response ?? err.message,
                    passportError.statusCode,
                );
            }
            // Если это стандартный Error без statusCode, преобразуем в UnauthorizedException
            throw new UnauthorizedException(err.message);
        }

        // Если нет пользователя, но нет ошибки - это тоже 401
        if (!user) {
            const message =
                info instanceof Error
                    ? info.message
                    : typeof info === 'string'
                      ? info
                      : 'Аутентификация не удалась';
            throw new UnauthorizedException(message);
        }

        return user;
    }
}
