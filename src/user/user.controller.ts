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
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  OmitType,
} from '@nestjs/swagger';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';

@ApiTags(`Пользователи`)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: `Создание пользователя` })
  @ApiBody({
	type: CreateUserDto,
	description: `Структура входных данных для создания пользователя`,
  })
  @ApiCreatedResponse({
	description: `Созданный пользователь`,
	type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
	]),
  })
  @ApiBadRequestResponse({
	description: `Структура ответа если пользователь с таким email существует в БД`,
	schema: {
		example: {
		message: `Пользователь с таким email: test@gmail.com уже существует`,
		error: 'Bad Request',
		},
	},
	status: 400,
  })
  @ApiNotFoundResponse({
	description: `Структура ответа если роль USER не найдена`,
	schema: {
		example: {
		status: 404,
		message: `Роль USER не найдена в БД`,
		},
	},
  })
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Post('/create')
  public async createUser(@Body() dto: CreateUserDto): Promise<UserModel> {
	return this.userService.createUser(dto);
  }

  @ApiOperation({ summary: `Получение списка всех пользователей` })
  @ApiResponse({
	description: `Список пользователей`,
	type: [
		OmitType(UserModel, ['roles', 'refresh_tokens', 'products', 'orders']),
	],
	status: 200,
  })
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get(`/get-list-users`)
  public async getListUsers(): Promise<UserModel[]> {
	return this.userService.getListUsers();
  }

  @ApiOperation({ summary: `Получение пользователя по идентификатору` })
  @ApiParam({
	name: `id`,
	type: `string`,
	description: `идентификатор пользователя`,
  })
  @ApiResponse({
	description: `Объект ответа содержащий пользователя`,
	type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
	]),
	status: 200,
  })
  @ApiNotFoundResponse({
	description: `Пользователь не найден в БД`,
	schema: {
		example: { statusCode: 404, message: `Пользователь не найден В БД` },
	},
  })
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/:id')
  public async getOne(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<UserModel> {
	return this.userService.findUserById(id);
  }

  @ApiOperation({ summary: `Обновление пользователя` })
  @ApiParam({
	name: `id`,
	type: `string`,
	description: `идентификатор пользователя`,
  })
  @ApiBody({
	type: CreateUserDto,
	description: `Структура входных данных для обновления пользователя`,
  })
  @ApiResponse({
	description: `Обновленный пользователь`,
	type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
	]),
	status: 200,
  })
  @ApiBadRequestResponse({
	description: `Если пользователь с таким же email найден в БД`,
	schema: {
		example: {
		statusCode: 400,
		message: 'Пользователь с таким email: user@email.com уже существует',
		error: 'Bad Request',
		},
	},
	status: 400,
  })
  @ApiNotFoundResponse({
	description: `Ели по какой-то причине роль пользователя не найдена`,
	schema: {
		example: {
		status: 404,
		message: 'Роль USER не найдена',
		},
	},
	status: 404,
  })
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Put('/update/:id')
  public async updateUser(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateUserDto,
  ): Promise<UserModel> {
	return this.userService.updateUser(id, dto);
  }

  @ApiOperation({ summary: `Удаление пользователя` })
  @ApiParam({
	name: `id`,
	type: `string`,
	description: `идентификатор пользователя`,
  })
  @ApiResponse({
	description: `Возвращается количество удаленных записей из БД`,
	schema: { example: 1 },
	status: 200,
  })
  @ApiNotFoundResponse({
	description: `Если пользователь не найден в БД`,
	schema: {
		example: {
		statusCode: 404,
		message: 'Пользователь не найден В БД',
		},
	},
	status: 404,
  })
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Delete('/delete/:id')
  public async removeUser(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<number> {
	return this.userService.removeUser(id);
  }

  @ApiOperation({ summary: `Добавление роли пользователю` })
  @ApiBody({
	type: AddRoleDto,
	description: `Структура входных данных для добавления роли пользователю`,
  })
  @ApiCreatedResponse({
	schema: { example: [{ id: 1, userId: 1, roleId: 1 }] },
	status: 201,
	description: `Структура ответа добавленной роли пользователю`,
  })
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Post('/role/add')
  public async addRole(@Body() dto: AddRoleDto) {
	return this.userService.addRole(dto);
  }

  @ApiOperation({ summary: `Удаление роли у пользователя` })
  @ApiBody({
	description: `Входные данные для удаления пользователя`,
	type: RemoveRoleDto,
  })
  @ApiResponse({
	description: `Возвращается количество удаленных записей из БД`,
	schema: { example: 1 },
	status: 200,
  })
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Delete('/role/delete')
  public async removeRole(@Body() dto: RemoveRoleDto) {
	return this.userService.removeRole(dto);
  }
}
