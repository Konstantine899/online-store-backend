import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { RoleService } from '@app/infrastructure/services';
import { CreateRoleDto } from '@app/infrastructure/dto';
import { ApiTags } from '@nestjs/swagger';
import {
    CreateRoleSwaggerDecorator,
    Roles,
    GetListRoleSwaggerDecorator,
    GetRoleSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import {
    CreateRoleResponse,
    GetRoleResponse,
    GetListRoleResponse,
} from '@app/infrastructure/responses';

import { IRoleController } from '@app/domain/controllers';

@ApiTags('Роль')
@Controller('role')
export class RoleController implements IRoleController {
    constructor(private readonly roleService: RoleService) {}

    @CreateRoleSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    public async createRole(
        @Body() dto: CreateRoleDto,
    ): Promise<CreateRoleResponse> {
        return this.roleService.createRole(dto);
    }

    @GetRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/one/:role')
    public async getRole(
        @Param('role') role: string,
    ): Promise<GetRoleResponse> {
        return this.roleService.getRole(role);
    }

    @GetListRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/list')
    public async getListRole(): Promise<GetListRoleResponse[]> {
        return this.roleService.getListRole();
    }
}
