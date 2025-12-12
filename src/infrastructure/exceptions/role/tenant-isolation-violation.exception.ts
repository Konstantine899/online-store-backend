import { ForbiddenException } from '@nestjs/common';

/**
 * Исключение для случая нарушения тенантской изоляции
 * Например, попытка получить доступ к ролям другого тенанта
 */
export class TenantIsolationViolationException extends ForbiddenException {
    constructor(operation?: string, userTenantId?: number, targetTenantId?: number) {
        let message = 'Нарушение тенантской изоляции';

        if (operation && userTenantId !== undefined && targetTenantId !== undefined) {
            message = `Нельзя выполнить операцию "${operation}" для тенанта ${targetTenantId}. Ваш тенант: ${userTenantId}`;
        } else if (userTenantId !== undefined && targetTenantId !== undefined) {
            message = `Нельзя получить доступ к тенанту ${targetTenantId}. Ваш тенант: ${userTenantId}`;
        } else if (operation) {
            message = `Нарушение тенантской изоляции при операции "${operation}"`;
        }

        super({
            statusCode: 403,
            message,
            name: 'TenantIsolationViolationException',
        });
    }
}

