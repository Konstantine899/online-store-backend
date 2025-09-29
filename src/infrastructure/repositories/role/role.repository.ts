import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from '@app/domain/models';
import { CreateRoleDto } from '@app/infrastructure/dto';
import {
    CreateRoleResponse,
    GetRoleResponse,
    GetListRoleResponse,
} from '@app/infrastructure/responses';
import { IRoleRepository } from '@app/domain/repositories';

@Injectable()
export class RoleRepository implements IRoleRepository {
    private static readonly ROLE_FIELDS = ['role', 'description'] as const;
    
    constructor(@InjectModel(RoleModel) private roleModel: typeof RoleModel) {}

    private pickAllowedFields(dto: CreateRoleDto): { role: string; description: string } {
        const { role, description } = dto;
        return { role, description };
    }

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        try {
            const allowedFields = this.pickAllowedFields(dto);
            const role = await this.roleModel.create(allowedFields);
            return this.findRole(role.role);
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
                throw new ConflictException('Роль уже существует');
            }
            throw error;
        }
    }

    public async findRole(role: string): Promise<GetRoleResponse> {
        return this.roleModel.findOne({
            where: { role },
        }) as Promise<GetRoleResponse>;
    }

    public async findListRole(): Promise<GetListRoleResponse[]> {
        return this.roleModel.findAll();
    }
}
