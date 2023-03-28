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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserModel } from './user.model';
import { AddRoleDto } from './dto/add-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(201)
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserModel> {
	return this.userService.create(dto);
  }

  @HttpCode(200)
  @Get('/:id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<UserModel> {
	return this.userService.findUserById(id);
  }

  @HttpCode(200)
  @Get()
  async getAll(): Promise<UserModel[]> {
	return this.userService.findAllUsers();
  }

  @HttpCode(200)
  @Put('/:id')
  async update(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateUserDto,
  ): Promise<UserModel> {
	return this.userService.update(id, dto);
  }

  @HttpCode(200)
  @Delete('/:id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
	return this.userService.remove(id);
  }

  @HttpCode(201)
  @Post('/role/add')
  public async addRole(@Body() dto: AddRoleDto) {
	return this.userService.addRole(dto);
  }

  @HttpCode(200)
  @Delete('/role/delete')
  public async removeRole(@Body() dto: RemoveRoleDto) {
	return this.userService.removeRole(dto);
  }
}
