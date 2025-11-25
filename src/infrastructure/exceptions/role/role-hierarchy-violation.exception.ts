import { ForbiddenException } from '@nestjs/common';

/**
 * Исключение для случая нарушения иерархии ролей
 * Например, попытка назначить роль более высокого уровня, чем у текущего пользователя
 */
export class RoleHierarchyViolationException extends ForbiddenException {
    constructor(
        operation?: string,
        userRoleLevel?: number,
        requiredLevel?: number,
    ) {
        let message = 'Нарушение иерархии ролей';

        if (operation && userRoleLevel !== undefined && requiredLevel !== undefined) {
            message = `Недостаточно прав для операции "${operation}". Ваш уровень: ${userRoleLevel}, требуется: ${requiredLevel}`;
        } else if (userRoleLevel !== undefined && requiredLevel !== undefined) {
            message = `Недостаточно прав. Ваш уровень: ${userRoleLevel}, требуется: ${requiredLevel}`;
        } else if (operation) {
            message = `Нарушение иерархии ролей при операции "${operation}"`;
        }

        super({
            statusCode: 403,
            message,
            name: 'RoleHierarchyViolationException',
        });
    }
}

