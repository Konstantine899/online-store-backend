import { Injectable } from '@nestjs/common';
import { BaseSSOGuard } from './base-sso.guard';

/**
 * SSO OIDC Guard
 * Использует Passport AuthGuard для OIDC стратегии (passport-custom)
 * Наследует общую логику обработки ошибок из BaseSSOGuard
 */
@Injectable()
export class SSOOIDCGuard extends BaseSSOGuard {
    constructor() {
        super('oidc');
    }

    /**
     * Получить имя параметра state для сообщений об ошибках
     * @protected
     */
    protected getStateParameterName(): string {
        return 'State parameter';
    }
}
