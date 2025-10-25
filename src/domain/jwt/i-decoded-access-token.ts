import type { RoleModel } from '@app/domain/models';

export interface IDecodedAccessToken {
    id?: number;
    roles?: RoleModel[];
    iat?: number;
    exp?: number;
    sub?: string;
}
