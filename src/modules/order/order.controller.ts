import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { OrderDto } from './dto/order.dto';
import { Request } from 'express';
import { AdminGetStoreOrderListSwaggerDecorator } from './decorators/admin-get-store-order-list-swagger-decorator';
import { ApiTags } from '@nestjs/swagger';
import { AdminGetOrderListUsersSwaggerDecorator } from './decorators/admin-get-order-list-users-swagger-decorator';
import { AdminGetOrderUsersSwaggerDecorator } from './decorators/admin-get-order-users-swagger-decorator';
import { AdminCreateOrderSwaggerDecorator } from './decorators/admin-create-order-swagger-decorator';
import { AdminRemoveOrderSwaggerDecorator } from './decorators/admin-remove-order-swagger-decorator';
import { RequestUserDto } from './dto/request-user.dto';
import { RequestSignedCookiesDto } from './dto/request-signed-cookies.dto';
import { UserCreateOrderSwaggerDecorator } from './decorators/user-create-order-swagger-decorator';
import { UserGetOrderSwaggerDecorator } from './decorators/user-get-order-swagger-decorator';
import { UserGetOrderListSwaggerDecorator } from './decorators/user-get-order-list-swagger-decorator';
import { GuestCreateOrderSwaggerDecorator } from './decorators/guest-create-order-swagger-decorator';
import { AdminGetStoreOrderListResponse } from './responses/admin-get-store-order-list.response';
import { AdminGetOrderListUserResponse } from './responses/admin-get-order-list-user.response';
import { AdminGetOrderUserResponse } from './responses/admin-get-order-user.response';
import { AdminCreateOrderResponse } from './responses/admin-create-order.response';
import { AdminRemoveOrderResponse } from './responses/admin-remove-order.response';
import { UserGetOrderListResponse } from './responses/user-get-order-list.response';
import { UserGetOrderResponse } from './responses/user-get-order.response';
import { UserCreateOrderResponse } from './responses/user-create-order.response';
import { GuestCreateOrderResponse } from './responses/guest-create-order.response';

interface IOrderController {
    adminGetStoreOrderList(): Promise<AdminGetStoreOrderListResponse[]>;

    adminGetOrderListUser(
        userId: number,
    ): Promise<AdminGetOrderListUserResponse[]>;

    adminGetOrderUser(orderId: number): Promise<AdminGetOrderUserResponse>;

    adminCreateOrder(dto: OrderDto): Promise<AdminCreateOrderResponse>;

    adminRemoveOrder(orderId: number): Promise<AdminRemoveOrderResponse>;

    userGetOrderList(request: Request): Promise<UserGetOrderListResponse[]>;

    userGetOrder(
        request: Request,
        orderId: number,
    ): Promise<UserGetOrderResponse>;

    userCreateOrder(
        request: Request,
        dto: Omit<OrderDto, 'userId'>,
    ): Promise<UserCreateOrderResponse>;

    guestCreateOrder(
        request: Request,
        dto: OrderDto,
    ): Promise<GuestCreateOrderResponse>;
}

@ApiTags('Заказы')
@Controller('order')
export class OrderController implements IOrderController {
    constructor(private readonly orderService: OrderService) {}

    /*Для администратора*/

    /*Получение списка всех заказов магазина*/
    @AdminGetStoreOrderListSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Get('/admin/get-all-order')
    public async adminGetStoreOrderList(): Promise<
        AdminGetStoreOrderListResponse[]
    > {
        return this.orderService.adminGetStoreOrderList();
    }

    /*Получение списка заказов пользователя*/
    @AdminGetOrderListUsersSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Get('/admin/get-all-order/user/:userId([0-9]+)')
    public async adminGetOrderListUser(
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<AdminGetOrderListUserResponse[]> {
        return this.orderService.adminGetOrderListUser(userId);
    }

    /*Получение заказа пользователя по id заказа*/
    @AdminGetOrderUsersSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Get('/admin/get-order/:orderId([0-9]+)')
    public async adminGetOrderUser(
        @Param('orderId', ParseIntPipe) orderId: number,
    ): Promise<AdminGetOrderUserResponse> {
        return this.orderService.adminGetOrderUser(orderId);
    }

    /*Создание заказа для пользователя администратором*/
    @AdminCreateOrderSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Post('/admin/create-order')
    public async adminCreateOrder(
        @Body() dto: OrderDto,
    ): Promise<AdminCreateOrderResponse> {
        return this.orderService.adminCreateOrder(dto);
    }

    /*Администратор Удаление заказа*/
    @AdminRemoveOrderSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Delete('/admin/delete-order/:orderId([0-9]+)')
    public async adminRemoveOrder(
        @Param('orderId', ParseIntPipe) orderId: number,
    ): Promise<AdminRemoveOrderResponse> {
        return this.orderService.adminRemoveOrder(orderId);
    }

    /*Для авторизованного пользователя*/

    /*Получение списка заказов пользователя*/
    @UserGetOrderListSwaggerDecorator()
    @HttpCode(200)
    @Roles('USER')
    @UseGuards(JwtGuard, RoleGuard)
    @Get('/user/get-all-order')
    public async userGetOrderList(
        @Req() request: Request,
    ): Promise<UserGetOrderListResponse[]> {
        const { id } = request.user as RequestUserDto;
        return this.orderService.userGetOrderList(id);
    }

    /*Получение одного заказа пользователя*/
    @UserGetOrderSwaggerDecorator()
    @HttpCode(200)
    @Roles('USER')
    @UseGuards(JwtGuard, RoleGuard)
    @Get('/user/get-order/:orderId([0-9]+)')
    public async userGetOrder(
        @Req() request: Request,
        @Param('orderId', ParseIntPipe) orderId: number,
    ): Promise<UserGetOrderResponse> {
        const { id } = request.user as RequestUserDto;
        return this.orderService.userGetOrder(orderId, id);
    }

    @UserCreateOrderSwaggerDecorator()
    @HttpCode(201)
    @Roles('USER')
    @UseGuards(JwtGuard, RoleGuard)
    @Post('/user/create-order')
    public async userCreateOrder(
        @Req() request: Request,
        @Body() dto: Omit<OrderDto, 'userId'>,
    ): Promise<UserCreateOrderResponse> {
        const { id } = request.user as RequestUserDto;
        const { cartId } = request.signedCookies as RequestSignedCookiesDto;
        return this.orderService.userCreateOrder(dto, id, cartId);
    }

    /*Для не авторизованного пользователя*/

    @GuestCreateOrderSwaggerDecorator()
    @HttpCode(201)
    @Post('/guest/create-order')
    public async guestCreateOrder(
        @Req() request: Request,
        @Body() dto: OrderDto,
    ): Promise<GuestCreateOrderResponse> {
        const { cartId } = request.signedCookies;
        return this.orderService.guestCreateOrder(dto, undefined, cartId);
    }
}
