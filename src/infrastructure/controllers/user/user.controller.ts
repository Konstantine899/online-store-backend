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
import { UserService } from '../../services/user/user.service';
import { CreateUserDto } from '../../dto/user/create-user.dto';
import { AddRoleDto } from '../../dto/user/add-role.dto';
import { RemoveRoleDto } from '../../dto/user/remove-role.dto';
import { Roles } from '../../common/decorators/roles-auth.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserSwaggerDecorator } from '../../common/decorators/swagger/user/create-user-swagger-decorator';
import { GetListUsersSwaggerDecorator } from '../../common/decorators/swagger/user/get-list-users-swagger-decorator';
import { GetUserSwaggerDecorator } from '../../common/decorators/swagger/user/get-user-swagger-decorator';
import { UpdateUserSwaggerDecorator } from '../../common/decorators/swagger/user/update-user-swagger-decorator';
import { RemoveUserSwaggerDecorator } from '../../common/decorators/swagger/user/remove-user-swagger-decorator';
import { AddRoleUserSwaggerDecorator } from '../../common/decorators/swagger/user/add-role-user-swagger-decorator';
import { RemoveRoleUserSwaggerDecorator } from '../../common/decorators/swagger/user/remove-role-user-swagger-decorator';
import { CreateUserResponse } from '../../responses/user/create-user.response';
import { GetListUsersResponse } from '../../responses/user/get-list-users.response';
import { GetUserResponse } from '../../responses/user/get-user-response';
import { UpdateUserResponse } from '../../responses/user/update-user-response';
import { RemoveUserResponse } from '../../responses/user/remove-user.response';
import { AddRoleResponse } from '../../responses/user/add-role.response';
import { RemoveRoleResponse } from '../../responses/user/remove-role.response';
import { AuthGuard } from '../../common/guards/auth.guard';
import { IUserController } from '../../../domain/controllers/i-user-controller';

@ApiTags('Пользователи')
@Controller('user')
export class UserController implements IUserController {
    constructor(private readonly userService: UserService) {}

    @CreateUserSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    public async createUser(
        @Body() dto: CreateUserDto,
    ): Promise<CreateUserResponse> {
        return this.userService.createUser(dto);
    }

    @GetListUsersSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/get-list-users')
    public async getListUsers(): Promise<GetListUsersResponse[]> {
        return this.userService.getListUsers();
    }

    @GetUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/:id')
    public async getUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetUserResponse> {
        return this.userService.getUser(id);
    }

    @UpdateUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
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
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/delete/:id')
    public async removeUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveUserResponse> {
        return this.userService.removeUser(id);
    }

    @AddRoleUserSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/role/add')
    public async addRole(@Body() dto: AddRoleDto): Promise<AddRoleResponse> {
        return this.userService.addRole(dto);
    }

    @RemoveRoleUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/role/delete')
    public async removeRole(
        @Body() dto: RemoveRoleDto,
    ): Promise<RemoveRoleResponse> {
        return this.userService.removeUserRole(dto);
    }
}
