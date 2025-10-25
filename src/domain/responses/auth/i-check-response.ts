import type { RoleModel } from '@app/domain/models';

export interface ICheckResponse {
    id: number;
    email: string;
    roles: RoleModel[];
}
