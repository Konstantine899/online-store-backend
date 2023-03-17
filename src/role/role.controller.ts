import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleModel } from './role.model';

@Controller('role')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @HttpCode(201)
  @Post()
  async create(@Body() dto: CreateRoleDto): Promise<RoleModel> {
	return this.roleService.create(dto);
  }

  @HttpCode(200)
  @Get('/:role')
  async getOne(@Param('role') role: string): Promise<RoleModel> {
	return this.roleService.findRole(role);
  }
}
