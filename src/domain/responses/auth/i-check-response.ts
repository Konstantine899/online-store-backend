import { RoleModel } from '../../models/role.model';

export interface ICheckResponse {
    id: number;
    email: string;
    roles: RoleModel[];
}
