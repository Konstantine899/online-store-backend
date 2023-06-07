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
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
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
import { GetUserResponse } from './responses/get-user-response';
import { UpdateUserResponse } from './responses/update-user-response';
import { RemoveUserResponse } from './responses/remove-user.response';
import { AddRoleResponse } from './responses/add-role.response';
import { RemoveRoleResponse } from './responses/remove-role.response';
import { TransactionInterceptor } from '../interceptors/transaction-interceptor';
import { TransactionDecorator } from '../decorators/transaction-decorator';
import { Transaction } from 'sequelize';

@ApiTags(`Пользователи`)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @CreateUserDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/create')
  @UseInterceptors(TransactionInterceptor)
  public async createUser(
	@Body() dto: CreateUserDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<CreateUserResponse> {
	return this.userService.createUser(dto);
  }

  @GetListUsersDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get(`/get-list-users`)
  @UseInterceptors(TransactionInterceptor)
  public async getListUsers(
	@TransactionDecorator() transaction: Transaction,
  ): Promise<GetListUsersResponse[]> {
	return this.userService.getListUsers();
  }

  @GetUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('/:id')
  @UseInterceptors(TransactionInterceptor)
  public async getUser(
	@Param('id', ParseIntPipe) id: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<GetUserResponse> {
	return this.userService.getUser(id);
  }

  @UpdateUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('/update/:id')
  @UseInterceptors(TransactionInterceptor)
  public async updateUser(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateUserDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<UpdateUserResponse> {
	return this.userService.updateUser(id, dto);
  }

  @RemoveUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/delete/:id')
  @UseInterceptors(TransactionInterceptor)
  public async removeUser(
	@Param('id', ParseIntPipe) id: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<RemoveUserResponse> {
	return this.userService.removeUser(id);
  }

  @AddRoleUserDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/role/add')
  @UseInterceptors(TransactionInterceptor)
  public async addRole(
	@Body() dto: AddRoleDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<AddRoleResponse> {
	return this.userService.addRole(dto);
  }

  @RemoveRoleUserDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/role/delete')
  @UseInterceptors(TransactionInterceptor)
  public async removeRole(
	@Body() dto: RemoveRoleDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<RemoveRoleResponse> {
	return this.userService.removeRole(dto);
  }
}
