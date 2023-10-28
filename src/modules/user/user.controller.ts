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
import { AddRoleDto } from './dto/add-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserSwaggerDecorator } from './decorators/create-user-swagger-decorator';
import { GetListUsersSwaggerDecorator } from './decorators/get-list-users-swagger-decorator';
import { GetUserSwaggerDecorator } from './decorators/get-user-swagger-decorator';
import { UpdateUserSwaggerDecorator } from './decorators/update-user-swagger-decorator';
import { RemoveUserSwaggerDecorator } from './decorators/remove-user-swagger-decorator';
import { AddRoleUserSwaggerDecorator } from './decorators/add-role-user-swagger-decorator';
import { RemoveRoleUserSwaggerDecorator } from './decorators/remove-role-user-swagger-decorator';
import { CreateUserResponse } from './responses/create-user.response';
import { GetListUsersResponse } from './responses/get-list-users.response';
import { GetUserResponse } from './responses/get-user-response';
import { UpdateUserResponse } from './responses/update-user-response';
import { RemoveUserResponse } from './responses/remove-user.response';
import { AddRoleResponse } from './responses/add-role.response';
import { RemoveRoleResponse } from './responses/remove-role.response';

@ApiTags('Пользователи')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @CreateUserSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Post('/create')
    public async createUser(
        @Body() dto: CreateUserDto,
    ): Promise<CreateUserResponse> {
        return this.userService.createUser(dto);
    }

    @GetListUsersSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Get('/get-list-users')
    public async getListUsers(): Promise<GetListUsersResponse[]> {
        return this.userService.getListUsers();
    }

    @GetUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Get('/:id')
    public async getUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetUserResponse> {
        return this.userService.getUser(id);
    }

    @UpdateUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Put('/update/:id')
    public async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateUserDto,
    ): Promise<UpdateUserResponse> {
        return this.userService.updateUser(id, dto);
    }

    @RemoveUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Delete('/delete/:id')
    public async removeUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveUserResponse> {
        return this.userService.removeUser(id);
    }

    @AddRoleUserSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Post('/role/add')
    public async addRole(@Body() dto: AddRoleDto): Promise<AddRoleResponse> {
        return this.userService.addRole(dto);
    }

    @RemoveRoleUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Delete('/role/delete')
    public async removeRole(
        @Body() dto: RemoveRoleDto,
    ): Promise<RemoveRoleResponse> {
        return this.userService.removeUserRole(dto);
    }
}
