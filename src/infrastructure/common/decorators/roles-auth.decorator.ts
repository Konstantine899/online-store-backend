import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]): Function => {
    return SetMetadata(ROLES_KEY, roles);
};
