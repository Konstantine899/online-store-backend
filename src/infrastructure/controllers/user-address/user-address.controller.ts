import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAddressService } from '@app/infrastructure/services';
import { CreateUserAddressDto, UpdateUserAddressDto } from '@app/infrastructure/dto';
import { AuthGuard, RoleGuard } from '@app/infrastructure/common/guards';
import { Roles } from '@app/infrastructure/common/decorators';

@ApiTags('Адреса пользователя')
@ApiBearerAuth('JWT-auth')
@Controller('user/addresses')
@UseGuards(AuthGuard, RoleGuard)
export class UserAddressController {
    constructor(private readonly userAddressService: UserAddressService) {}

    @ApiOperation({ summary: 'Список адресов', description: 'Возвращает адреса текущего пользователя' })
    @ApiOkResponse({ description: 'Успех' })
    @Roles('USER', 'ADMIN')
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAddresses(@Req() req: Request & { user: { id: number } }) {
        const userId = req.user.id;
        const data = await this.userAddressService.getAddresses(userId);
        return { data };
    }

    @ApiOperation({ summary: 'Получить адрес', description: 'Возвращает адрес по id' })
    @ApiOkResponse({ description: 'Успех' })
    @Roles('USER', 'ADMIN')
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getAddress(
        @Req() req: Request & { user: { id: number } },
        @Param('id', ParseIntPipe) id: number,
    ) {
        const userId = req.user.id;
        const data = await this.userAddressService.getAddress(userId, id);
        return { data };
    }

    @ApiOperation({ summary: 'Создать адрес', description: 'Создаёт новый адрес' })
    @ApiOkResponse({ description: 'Создано' })
    @Roles('USER', 'ADMIN')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createAddress(
        @Req() req: Request & { user: { id: number } },
        @Body() dto: CreateUserAddressDto,
    ) {
        const userId = req.user.id;
        const data = await this.userAddressService.createAddress(userId, dto);
        return { data };
    }

    @ApiOperation({ summary: 'Обновить адрес', description: 'Обновляет адрес по id' })
    @ApiOkResponse({ description: 'Обновлено' })
    @Roles('USER', 'ADMIN')
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async updateAddress(
        @Req() req: Request & { user: { id: number } },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserAddressDto,
    ) {
        const userId = req.user.id;
        const data = await this.userAddressService.updateAddress(userId, id, dto);
        return { data };
    }

    @ApiOperation({ summary: 'Удалить адрес', description: 'Удаляет адрес по id' })
    @ApiOkResponse({ description: 'Удалено' })
    @Roles('USER', 'ADMIN')
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async removeAddress(
        @Req() req: Request & { user: { id: number } },
        @Param('id', ParseIntPipe) id: number,
    ) {
        const userId = req.user.id;
        return this.userAddressService.removeAddress(userId, id);
    }

    @ApiOperation({ summary: 'Сделать основным', description: 'Устанавливает адрес основным' })
    @ApiOkResponse({ description: 'Обновлено' })
    @Roles('USER', 'ADMIN')
    @Patch(':id/set-default')
    @HttpCode(HttpStatus.OK)
    async setDefaultAddress(
        @Req() req: Request & { user: { id: number } },
        @Param('id', ParseIntPipe) id: number,
    ) {
        const userId = req.user.id;
        const data = await this.userAddressService.setDefaultAddress(userId, id);
        return { data };
    }
}