import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseSSOGuard } from './base-sso.guard';

/**
 * SSO OAuth2 Guard
 * Использует Passport AuthGuard для OAuth 2.0 стратегии
 * Наследует общую логику обработки ошибок из BaseSSOGuard
 */
@Injectable()
export class SSOOAuth2Guard extends AuthGuard('oauth2') {
    private readonly baseSSOGuard = new (class extends BaseSSOGuard {
        protected getStateParameterName(): string {
            return 'State parameter';
        }
    })();

    handleRequest<TUser = unknown>(
        err: Error | null,
        user: TUser,
        info: Error | string | undefined,
        context: ExecutionContext,
    ): TUser {
        return this.baseSSOGuard.handleRequest(err, user, info, context);
    }

    /**
     * Получить имя параметра state для сообщений об ошибках
     * @protected
     */
    protected getStateParameterName(): string {
        return 'State parameter';
    }
}
