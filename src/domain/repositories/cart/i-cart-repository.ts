import type { CartModel } from '@app/domain/models';

export interface ICartRepository {
    findCart(cartId: number): Promise<CartModel>;

    createCart(): Promise<CartModel>;

    appendToCart(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel>;

    increment(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel>;

    decrement(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel>;

    removeFromCart(cart_id: number, product_id: number): Promise<CartModel>;

    clearCart(cart_id: number): Promise<CartModel>;
}
