import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
	description: `Create user`,
	type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
	]),
  })
  @ApiBadRequestResponse({
	description: `Bad Request`,
	status: HttpStatus.BAD_REQUEST,
	schema: {
		title: `Существующий email в БД`,
		example: {
		message: `Пользователь с таким email: test@gmail.com уже существует`,
		error: 'Bad Request',
		},
	},
  })
  @ApiNotFoundResponse({
	description: `Not Found`,
	status: HttpStatus.NOT_FOUND,
	schema: {
		title: `Роль USER не найдена в БД`,
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
	description: `Get list users`,
	status: HttpStatus.OK,
	type: [
		OmitType(UserModel, ['roles', 'refresh_tokens', 'products', 'orders']),
	],
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
	description: `Get user`,
	status: HttpStatus.OK,
	type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
	]),
  })
  @ApiNotFoundResponse({
	description: `Not Found`,
	status: HttpStatus.NOT_FOUND,
	schema: {
		title: `Пользователь не найден в БД`,
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
	description: `Updated user`,
	status: HttpStatus.OK,
	type: OmitType(UserModel, [
		'roles',
		'refresh_tokens',
		'products',
		'orders',
	]),
  })
  @ApiBadRequestResponse({
	description: `Bad Request`,
	status: HttpStatus.BAD_REQUEST,
	schema: {
		title: `Существующий email в БД`,
		example: {
		statusCode: 400,
		message: 'Пользователь с таким email: user@email.com уже существует',
		error: 'Bad Request',
		},
	},
  })
  @ApiNotFoundResponse({
	description: `Not Found`,
	status: HttpStatus.NOT_FOUND,
	schema: {
		title: `Роль пользователя не найдена`,
		example: {
		status: 404,
		message: 'Роль USER не найдена',
		},
	},
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
	description: `Remove user`,
	status: HttpStatus.OK,
	schema: { title: 'Удалено записей', example: 1 },
  })
  @ApiNotFoundResponse({
	description: `Not Found`,
	status: HttpStatus.NOT_FOUND,
	schema: {
		title: `Пользователь не найден В БД`,
		example: {
		title: `Пользователь не найден В БД`,
		statusCode: 404,
		message: 'Пользователь не найден В БД',
		},
	},
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
	description: `Add Role`,
	status: HttpStatus.CREATED,
	schema: {
		title: `Добавленная роль`,
		example: [{ id: 1, userId: 1, roleId: 1 }],
	},
  })
  @ApiNotFoundResponse({
	description: `Not Found`,
	status: HttpStatus.NOT_FOUND,
	schema: {
		anyOf: [
		{
			title: 'Пользователь',
			description: `Пользователь не найден в БД`,
			example: { statusCode: 404, message: 'Пользователь не найден в БД' },
		},
		{
			title: 'Роль пользователя',
			description: `Роль не найдена в БД`,
			example: { statusCode: 404, message: 'Роль не найдена в БД' },
		},
		],
	},
  })
  @ApiConflictResponse({
	description: `Conflict`,
	status: HttpStatus.CONFLICT,
	schema: {
		example: {
		statusCode: 409,
		message: 'Данному пользователю уже присвоена роль ADMIN',
		},
	},
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
	description: `Remove Role`,
	status: HttpStatus.OK,
	schema: { title: `Количество удаленных записей из БД`, example: 1 },
  })
  @ApiNotFoundResponse({
	description: `Not Found`,
	status: HttpStatus.NOT_FOUND,
	schema: {
		anyOf: [
		{
			title: 'Поиск не существующего пользователя',
			description: `Пользователь не найден в БД`,
			example: { statusCode: 404, message: 'Пользователь не найден в БД' },
		},
		{
			title: `Удаление роли которой нет у пользователя`,
			description: `Удаление роли пользователя которая ему не принадлежит`,
			example: {
			statusCode: 404,
			message: `Роль ADMIN не принадлежит данному пользователю`,
			},
		},
		],
	},
  })
  @ApiForbiddenResponse({
	description: `Forbidden`,
	status: HttpStatus.FORBIDDEN,
	schema: {
		title: `Запрет удаления роли USER`,
		example: {
		status: 403,
		message: 'Удаление роли USER запрещено',
		},
	},
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
