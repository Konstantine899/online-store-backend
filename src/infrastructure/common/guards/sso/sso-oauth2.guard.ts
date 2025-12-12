import { Injectable } from '@nestjs/common';
import { BaseSSOGuard } from './base-sso.guard';

/**
 * SSO OAuth2 Guard
 * Использует Passport AuthGuard для OAuth 2.0 стратегии
 * Наследует общую логику обработки ошибок из BaseSSOGuard
 */
@Injectable()
export class SSOOAuth2Guard extends BaseSSOGuard {
    constructor() {
        super('oauth2');
    }

    /**
     * Получить имя параметра state для сообщений об ошибках
     * @protected
     */
    protected getStateParameterName(): string {
        return 'State parameter';
    }
}
