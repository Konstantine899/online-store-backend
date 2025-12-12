import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseSSOGuard } from './base-sso.guard';

/**
 * SSO OIDC Guard
 * Использует Passport AuthGuard для OIDC стратегии (passport-custom)
 * Наследует общую логику обработки ошибок из BaseSSOGuard
 */
@Injectable()
export class SSOOIDCGuard extends AuthGuard('oidc') {
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
}
