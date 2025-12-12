import type { Request, Response } from 'express';
import type {
    CartResponse,
    AppendToCartResponse,
    IncrementResponse,
    DecrementResponse,
    RemoveProductFromCartResponse,
    ClearCartResponse,
    ApplyPromoCodeResponse,
    RemovePromoCodeResponse,
} from '@app/infrastructure/responses';
import type {
    AddToCartDto,
    UpdateCartItemDto,
    ApplyCouponDto,
} from '@app/infrastructure/dto';

export interface ICartController {
    getCart(request: Request, response: Response): Promise<CartResponse>;

    appendToCart(
        request: Request,
        response: Response,
        dto: AddToCartDto,
    ): Promise<AppendToCartResponse>;

    increment(
        request: Request,
        response: Response,
        dto: UpdateCartItemDto,
    ): Promise<IncrementResponse>;

    decrement(
        request: Request,
        response: Response,
        dto: UpdateCartItemDto,
    ): Promise<DecrementResponse>;

    removeProductFromCart(
        request: Request,
        response: Response,
        productId: number,
    ): Promise<RemoveProductFromCartResponse>;

    clearCart(request: Request, response: Response): Promise<ClearCartResponse>;

    applyPromoCode(
        request: Request,
        response: Response,
        dto: ApplyCouponDto,
    ): Promise<ApplyPromoCodeResponse>;

    removePromoCode(
        request: Request,
        response: Response,
    ): Promise<RemovePromoCodeResponse>;
}
