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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  OmitType,
} from '@nestjs/swagger';

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
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Post('/create')
  public async create(@Body() dto: CreateUserDto): Promise<UserModel> {
    return this.userService.create(dto);
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

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get()
  public async getAll(): Promise<UserModel[]> {
    return this.userService.findAllUsers();
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Put('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateUserDto,
  ): Promise<UserModel> {
    return this.userService.update(id, dto);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Delete('/delete/:id')
  public async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.userService.remove(id);
  }

  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Post('/role/add')
  public async addRole(@Body() dto: AddRoleDto) {
    return this.userService.addRole(dto);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Delete('/role/delete')
  public async removeRole(@Body() dto: RemoveRoleDto) {
    return this.userService.removeRole(dto);
  }
}
