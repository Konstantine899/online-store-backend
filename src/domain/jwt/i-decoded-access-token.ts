import { RoleModel } from '../models/role.model';

export interface IDecodedAccessToken {
    id?: number;
    roles?: RoleModel[];
    iat?: number;
    exp?: number;
    sub?: string;
}
