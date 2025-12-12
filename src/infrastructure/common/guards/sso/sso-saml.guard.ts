import { Injectable } from '@nestjs/common';
import { BaseSSOGuard } from './base-sso.guard';

/**
 * SSO SAML Guard
 * Использует Passport AuthGuard для SAML стратегии
 * Наследует общую логику обработки ошибок из BaseSSOGuard
 */
@Injectable()
export class SSOSAMLGuard extends BaseSSOGuard {
    constructor() {
        super('saml');
    }

    /**
     * Получить имя параметра state для сообщений об ошибках
     * @protected
     */
    protected getStateParameterName(): string {
        return 'RelayState parameter';
    }
}
