import { ConflictException } from '@nestjs/common';

/**
 * Исключение для случая, когда роль уже существует
 */
export class RoleAlreadyExistsException extends ConflictException {
    constructor(roleName: string) {
        super({
            statusCode: 409,
            message: `Роль "${roleName}" уже существует`,
            name: 'RoleAlreadyExistsException',
        });
    }
}

