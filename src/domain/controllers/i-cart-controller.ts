import { Request, Response } from 'express';
import { CartResponse } from '../../infrastructure/responses/cart/cart.response';
import { AppendToCartResponse } from '../../infrastructure/responses/cart/append-to-cart.response';
import { IncrementResponse } from '../../infrastructure/responses/cart/increment.response';
import { DecrementResponse } from '../../infrastructure/responses/cart/decrement.response';
import { RemoveProductFromCartResponse } from '../../infrastructure/responses/cart/remove-product-from-cart.response';
import { ClearCartResponse } from '../../infrastructure/responses/cart/clear-cart.response';

export interface ICartController {
    getCart(request: Request, response: Response): Promise<CartResponse>;

    appendToCart(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<AppendToCartResponse>;

    increment(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<IncrementResponse>;

    decrement(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<DecrementResponse>;

    removeProductFromCart(
        request: Request,
        response: Response,
        productId: number,
    ): Promise<RemoveProductFromCartResponse>;

    clearCart(request: Request, response: Response): Promise<ClearCartResponse>;
}
