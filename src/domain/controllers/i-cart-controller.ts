import { Request, Response } from 'express';
import {
    CartResponse,
    AppendToCartResponse,
    IncrementResponse,
    DecrementResponse,
    RemoveProductFromCartResponse,
    ClearCartResponse,
} from '@app/infrastructure/responses';

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
