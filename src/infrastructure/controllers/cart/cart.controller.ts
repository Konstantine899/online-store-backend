import { CartService } from '@app/infrastructure/services';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import {
    AppendToCartSwaggerDecorator,
    ApplyPromoCodeSwaggerDecorator,
    ClearCartSwaggerDecorator,
    DecrementSwaggerDecorator,
    GetCartSwaggerDecorator,
    IncrementSwaggerDecorator,
    RemoveProductFromCartSwaggerDecorator,
    RemovePromoCodeSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import {
    AddToCartDto,
    ApplyCouponDto,
    UpdateCartItemDto,
} from '@app/infrastructure/dto';
import {
    AppendToCartResponse,
    ApplyPromoCodeResponse,
    CartResponse,
    ClearCartResponse,
    DecrementResponse,
    IncrementResponse,
    RemoveProductFromCartResponse,
    RemovePromoCodeResponse,
} from '@app/infrastructure/responses';

import { ICartController } from '@app/domain/controllers';

@ApiTags('Корзина')
@Controller('cart')
export class CartController implements ICartController {
    constructor(private readonly cartService: CartService) {}

    @GetCartSwaggerDecorator()
    @HttpCode(200)
    @Get('/get-cart')
    public async getCart(
        @Req() request: Request,
        // passthrough: true дает возможность использовать не только cookie, но и другие возможности framework
        @Res({ passthrough: true }) response: Response,
    ): Promise<CartResponse> {
        return this.cartService.getCart(request, response);
    }

    @AppendToCartSwaggerDecorator()
    @HttpCode(200)
    @Post('/items')
    public async appendToCart(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Body() dto: AddToCartDto,
    ): Promise<AppendToCartResponse> {
        return this.cartService.appendToCart(
            request,
            response,
            dto.productId,
            dto.quantity,
        );
    }

    @IncrementSwaggerDecorator()
    @HttpCode(200)
    @Patch('/items/increment')
    public async increment(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Body() dto: UpdateCartItemDto,
    ): Promise<IncrementResponse> {
        return this.cartService.increment(
            request,
            response,
            dto.productId,
            dto.amount,
        );
    }

    @DecrementSwaggerDecorator()
    @HttpCode(200)
    @Patch('/items/decrement')
    public async decrement(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Body() dto: UpdateCartItemDto,
    ): Promise<DecrementResponse> {
        return this.cartService.decrement(
            request,
            response,
            dto.productId,
            dto.amount,
        );
    }

    @RemoveProductFromCartSwaggerDecorator()
    @HttpCode(200)
    @Delete('/items/:productId')
    public async removeProductFromCart(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Param('productId', ParseIntPipe) productId: number,
    ): Promise<RemoveProductFromCartResponse> {
        return this.cartService.removeProductFromCart(
            request,
            response,
            productId,
        );
    }

    @ClearCartSwaggerDecorator()
    @HttpCode(200)
    @Delete()
    public async clearCart(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ClearCartResponse> {
        return this.cartService.clearCart(request, response);
    }

    @ApplyPromoCodeSwaggerDecorator()
    @HttpCode(200)
    @Post('/promo-code')
    public async applyPromoCode(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Body() dto: ApplyCouponDto,
    ): Promise<ApplyPromoCodeResponse> {
        return this.cartService.applyPromoCode(request, response, dto.code);
    }

    @RemovePromoCodeSwaggerDecorator()
    @HttpCode(200)
    @Delete('/promo-code')
    public async removePromoCode(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<RemovePromoCodeResponse> {
        return this.cartService.removePromoCode(request, response);
    }
}
