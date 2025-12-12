import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseSSOGuard } from './base-sso.guard';

/**
 * SSO SAML Guard
 * Использует Passport AuthGuard для SAML стратегии
 * Наследует общую логику обработки ошибок из BaseSSOGuard
 */
@Injectable()
export class SSOSAMLGuard extends AuthGuard('saml') {
    private readonly baseSSOGuard = new (class extends BaseSSOGuard {
        protected getStateParameterName(): string {
            return 'RelayState parameter';
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
