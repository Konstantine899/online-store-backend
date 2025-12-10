import {
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * SSO SAML Guard
 * Использует Passport AuthGuard для SAML стратегии
 * Переопределяет handleRequest для правильной обработки ошибок с statusCode
 */
@Injectable()
export class SSOSAMLGuard extends AuthGuard('saml') {
    /**
     * Переопределяем handleRequest для правильной обработки ошибок из Passport
     * Ошибки с statusCode преобразуются в соответствующие HttpException
     */
    handleRequest<TUser = unknown>(
        err: Error | null,
        user: TUser,
        info: Error | string | undefined,
        context: ExecutionContext,
    ): TUser {
        // Если есть ошибка, обрабатываем её
        if (err) {
            // Проверяем, есть ли statusCode в ошибке (из convertToPassportError)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const statusCode = (err as any).statusCode;
            if (statusCode) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response = (err as any).response;
                throw new HttpException(
                    response ?? err.message,
                    statusCode,
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

