import { ForbiddenException } from '@nestjs/common';

/**
 * Исключение для случая, когда у пользователя недостаточно прав для операции
 */
export class InsufficientPermissionsException extends ForbiddenException {
    constructor(operation?: string, requiredPermission?: string) {
        let message = 'У вас недостаточно прав для выполнения этой операции';

        if (operation && requiredPermission) {
            message = `У вас недостаточно прав для операции "${operation}". Требуется разрешение: ${requiredPermission}`;
        } else if (operation) {
            message = `У вас недостаточно прав для операции "${operation}"`;
        } else if (requiredPermission) {
            message = `У вас недостаточно прав. Требуется разрешение: ${requiredPermission}`;
        }

        super({
            statusCode: 403,
            message,
            name: 'InsufficientPermissionsException',
        });
    }
}

