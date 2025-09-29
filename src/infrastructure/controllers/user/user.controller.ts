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
} from '@nestjs/common';
import { UserService } from '@app/infrastructure/services';
import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
} from '@app/infrastructure/dto';

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
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

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
    public async getListUsers(): Promise<GetPaginatedUsersResponse> {
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
    ): Promise<RemoveUserRoleResponse> {
        return this.userService.removeUserRole(dto);
    }

    @ApiOperation({ summary: 'Обновить номер телефона', description: 'Обновляет телефон текущего пользователя' })
    @ApiOkResponse({ description: UserController.SUCCESS_DESCRIPTION })
    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('profile/phone')
    @HttpCode(HttpStatus.OK)
    async updatePhone(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: UpdateUserPhoneDto,
    ) {
        const userId = this.extractUserId(req);
        const user = await this.userService.updatePhone(userId, dto.phone);
        return this.createResponse({ id: user.id, phone: user.phone });
    }
}
