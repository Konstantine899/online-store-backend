import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleModel } from './role.model';
import { ApiTags } from '@nestjs/swagger';
import { CreateRoleDocumentation } from './decorators/create-role.documentation';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from './role.guard';
import { AllRolesDocumentation } from './decorators/all-roles-documentation';
import { GetRoleDocumentation } from './decorators/get-role.documentation';
import { CreateRoleResponse } from './responses/create-role.response';
import { GetRoleResponse } from './responses/get-role.response';

@ApiTags(`Роль`)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @CreateRoleDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post(`/create`)
  public async createRole(
	@Body() dto: CreateRoleDto,
  ): Promise<CreateRoleResponse> {
	return this.roleService.createRole(dto);
  }

  @GetRoleDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('/one/:role')
  public async getRole(@Param('role') role: string): Promise<GetRoleResponse> {
	return this.roleService.getRole(role);
  }

  @AllRolesDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('/list')
  public async getListRoles(): Promise<RoleModel[]> {
	return this.roleService.getListRoles();
  }
}
