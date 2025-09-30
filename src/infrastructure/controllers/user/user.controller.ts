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
    Patch,
    UseGuards,
    HttpStatus,
    Req,
    Query,
    DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from '@app/infrastructure/services';
import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
} from '@app/infrastructure/dto';
import { UpdateUserDto } from '@app/infrastructure/dto/user/update-user.dto';

import {
    Roles,
    CreateUserSwaggerDecorator,
    GetListUsersSwaggerDecorator,
    GetUserSwaggerDecorator,
    UpdateUserSwaggerDecorator,
    RemoveUserSwaggerDecorator,
    AddRoleUserSwaggerDecorator,
    RemoveRoleUserSwaggerDecorator,
    UpdateUserPhoneSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { ChangePasswordSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/change-password.swagger';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { ApiTags } from '@nestjs/swagger';

import {
    CreateUserResponse,
    GetUserResponse,
    UpdateUserResponse,
    RemoveUserResponse,
    AddRoleResponse,
    RemoveUserRoleResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';
import { UpdateUserPhoneDto } from '@app/infrastructure/dto';
import { ChangePasswordDto } from '@app/infrastructure/dto/user/change-password.dto';
import { UpdateUserPhoneResponse } from '@app/infrastructure/responses';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';

import { IUserController } from '@app/domain/controllers';

// Типизированный интерфейс для Request
interface AuthenticatedRequest extends Request {
    user: { id: number };
}

@ApiTags('Пользователи')
@Controller('user')
export class UserController implements IUserController {
    // Статические константы для переиспользования
    private static readonly USER_ROLES = ['USER', 'ADMIN', 'MANAGER'] as const;
    private static readonly ADMIN_ROLES = ['ADMIN'] as const;
    private static readonly SUCCESS_DESCRIPTION = 'Успех';
    private static readonly CREATED_DESCRIPTION = 'Создано';
    private static readonly UPDATED_DESCRIPTION = 'Обновлено';
    private static readonly DELETED_DESCRIPTION = 'Удалено';

    constructor(private readonly userService: UserService) {}

    // Метод для извлечения userId с валидацией
    private extractUserId(req: AuthenticatedRequest): number {
        return req.user.id;
    }

    // Метод для создания ответа
    private createResponse<T>(data: T): { data: T } {
        return { data };
    }

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
    public async getListUsers(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userService.getListUsers(page, limit);
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
        @Body() dto: UpdateUserDto,
    ): Promise<UpdateUserResponse> {
        return this.userService.updateUser(id, dto as unknown as CreateUserDto);
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
    ): Promise<RemoveUserRoleResponse> {
        return this.userService.removeUserRole(dto);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    public async getMe(@Req() req: AuthenticatedRequest) {
        const userId = this.extractUserId(req);
        return this.userService.findAuthenticatedUser(userId);
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @UpdateUserPhoneSwaggerDecorator()
    @Patch('profile/phone')
    @HttpCode(HttpStatus.OK)
    async updatePhone(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: UpdateUserPhoneDto,
    ): Promise<UpdateUserPhoneResponse> {
        const userId = this.extractUserId(req);
        const user = await this.userService.updatePhone(userId, dto.phone);
        return { id: user.id, phone: user.phone! };
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @ChangePasswordSwaggerDecorator()
    @Patch('profile/password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: ChangePasswordDto,
    ) {
        const userId = this.extractUserId(req);
        await this.userService.changePassword(userId, dto.oldPassword, dto.newPassword);
        return { status: HttpStatus.OK, message: 'success' };
    }
}
