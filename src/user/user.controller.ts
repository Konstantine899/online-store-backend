import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserModel } from './user.model';
import { AddRoleDto } from './dto/add-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDocumentation } from './decorators/create-user.documentation';
import { GetListUsersDocumentation } from './decorators/get-list-users.documentation';
import { GetUserDocumentation } from './decorators/get-user.documentation';
import { UpdateUserDocumentation } from './decorators/update-user.documentation';
import { RemoveUserDocumentation } from './decorators/remove-user.documentation';
import { AddRoleUserDocumentation } from './decorators/add-role-user.documentation';
import { RemoveRoleUserDocumentation } from './decorators/remove-role-user.documentation';
import { CreateUserResponse } from './responses/create-user.response';
import { GetListUsersResponse } from './responses/get-list-users.response';

@ApiTags(`Пользователи`)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @CreateUserDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/create')
  public async createUser(
	@Body() dto: CreateUserDto,
  ): Promise<CreateUserResponse> {
	return this.userService.createUser(dto);
  }

  @GetListUsersDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get(`/get-list-users`)
  public async getListUsers(): Promise<GetListUsersResponse[]> {
	return this.userService.getListUsers();
  }

  @GetUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('/:id')
  public async getUser(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<UserModel> {
	return this.userService.getUser(id);
  }

  @UpdateUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('/update/:id')
  public async updateUser(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateUserDto,
  ): Promise<UserModel> {
	return this.userService.updateUser(id, dto);
  }

  @RemoveUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/delete/:id')
  public async removeUser(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<number> {
	return this.userService.removeUser(id);
  }

  @AddRoleUserDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/role/add')
  public async addRole(@Body() dto: AddRoleDto) {
	return this.userService.addRole(dto);
  }

  @RemoveRoleUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/role/delete')
  public async removeRole(@Body() dto: RemoveRoleDto) {
	return this.userService.removeRole(dto);
  }
}
