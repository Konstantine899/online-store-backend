import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { RoleService } from '../../services/role/role.service';
import { CreateRoleDto } from '../../dto/role/create-role.dto';
import { ApiTags } from '@nestjs/swagger';
import { CreateRoleSwaggerDecorator } from '../../common/decorators/swagger/role/create-role-swagger-decorator';
import { Roles } from '../../common/decorators/roles-auth.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import { GetListRoleSwaggerDecorator } from '../../common/decorators/swagger/role/get-list-role-swagger-decorator';
import { GetRoleSwaggerDecorator } from '../../common/decorators/swagger/role/get-role-swagger-decorator';
import { CreateRoleResponse } from '../../responses/role/create-role.response';
import { GetRoleResponse } from '../../responses/role/get-role.response';
import { GetListRoleResponse } from '../../responses/role/get-list-role.response';
import { AuthGuard } from '../../common/guards/auth.guard';
import { IRoleController } from '../../../domain/controllers/i-role-controller';

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