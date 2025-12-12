import { NotFoundException } from '@nestjs/common';

/**
 * Исключение для случая, когда роль не найдена
 */
export class RoleNotFoundException extends NotFoundException {
    constructor(roleIdentifier?: string | number) {
        const message = roleIdentifier
            ? `Роль с идентификатором "${roleIdentifier}" не найдена`
            : 'Роль не найдена';

        super({
            statusCode: 404,
            message,
            name: 'RoleNotFoundException',
        });
    }
}

