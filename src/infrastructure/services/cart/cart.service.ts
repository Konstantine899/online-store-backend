import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from '../../repositories/cart/cart.repository';
import { Request, Response } from 'express';
import { CartModel, ProductModel } from '@app/domain/models';
import { ProductRepository } from '../../repositories/product/product.repository';
import { CartResponse } from '../../responses/cart/cart.response';
import { ICartTransformData } from '../../../domain/transform/cart/i-cart-transform-data';
import { AppendToCartResponse } from '../../responses/cart/append-to-cart.response';
import { IncrementResponse } from '../../responses/cart/increment.response';
import { DecrementResponse } from '../../responses/cart/decrement.response';
import { RemoveProductFromCartResponse } from '../../responses/cart/remove-product-from-cart.response';
import { ClearCartResponse } from '../../responses/cart/clear-cart.response';
import { ICartService } from '@app/domain/services';

@Injectable()
export class CartService implements ICartService {
    constructor(
        private readonly cartRepository: CartRepository,
        private readonly productRepository: ProductRepository,
    ) {}

    maxAge: number = 60 * 60 * 1000 * 24 * 365;
    signed: boolean = true;

    public async getCart(
        request: Request,
        response: Response,
    ): Promise<CartResponse> {
        let cart: CartModel;
        const { cartId } = request.signedCookies;
        if (cartId) {
            cart = await this.cartRepository.findCart(cartId);
        } else {
            cart = await this.cartRepository.createCart();
        }

        response.cookie('cartId', cart.id, {
            maxAge: this.maxAge,
            signed: this.signed, // использую секретный ключ для подписки value
        });
        return this.TransformData(cart);
    }

    public async appendToCart(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<AppendToCartResponse> {
        let { cartId } = request.signedCookies as { cartId: number };
        const product = await this.findProduct(productId);
        if (!cartId) {
            const created = await this.cartRepository.createCart();
            cartId = created.id;
        }
        const foundCart = await this.findCart(cartId);
        const cart = await this.cartRepository.appendToCart(
            foundCart.id,
            product.id,
            quantity,
        );
        response.cookie('cartId', cart.id, {
            maxAge: this.maxAge,
            signed: this.signed,
        });
        return this.TransformData(cart);
    }

    public async increment(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<IncrementResponse> {
        const product = await this.findProduct(productId);
        let { cartId } = request.signedCookies as { cartId: number };
        if (!cartId) {
            const created = await this.cartRepository.createCart();
            cartId = created.id;
        }
        const foundCart = await this.findCart(cartId);
        const cart = await this.cartRepository.increment(
            foundCart.id,
            product.id,
            quantity,
        );
        response.cookie('cartId', cart.id, {
            maxAge: this.maxAge,
            signed: this.signed,
        });
        return this.TransformData(cart);
    }

    public async decrement(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<DecrementResponse> {
        const product = await this.findProduct(productId);
        let { cartId } = request.signedCookies as { cartId: number };
        if (!cartId) {
            const created = await this.cartRepository.createCart();
            cartId = created.id;
        }
        const foundCart = await this.findCart(cartId);
        const cart = await this.cartRepository.decrement(
            foundCart.id,
            product.id,
            quantity,
        );
        response.cookie('cartId', cart.id, {
            maxAge: this.maxAge,
            signed: this.signed,
        });
        return this.TransformData(cart);
    }

    public async removeProductFromCart(
        request: Request,
        response: Response,
        productId: number,
    ): Promise<RemoveProductFromCartResponse> {
        const product = await this.findProduct(productId);
        let { cartId } = request.signedCookies as { cartId: number };
        if (!cartId) {
            const created = await this.cartRepository.createCart();
            cartId = created.id;
        }
        const foundCart = await this.findCart(cartId);
        const cart = await this.cartRepository.removeFromCart(
            foundCart.id,
            product.id,
        );
        response.cookie('cartId', cart.id, {
            maxAge: this.maxAge,
            signed: this.signed,
        });
        return this.TransformData(cart);
    }

    public async clearCart(
        request: Request,
        response: Response,
    ): Promise<ClearCartResponse> {
        let { cartId } = request.signedCookies as { cartId: number };
        if (!cartId) {
            const created = await this.cartRepository.createCart();
            cartId = created.id;
        }
        const foundCart = await this.findCart(cartId);
        const cart = await this.cartRepository.clearCart(foundCart.id);
        response.cookie('cartId', cart.id, {
            maxAge: this.maxAge,
            signed: this.signed,
        });
        return this.TransformData(cart);
    }

    private TransformData(cart: CartModel): ICartTransformData {
        const data: ICartTransformData = {
            cartId: undefined,
            products: undefined,
        };
        data.products = [];

        data.cartId = cart.id;
        if (cart.products) {
            data.products = cart.products.map((item: ProductModel): any => {
                return {
                    productId: item.id,
                    name: item.name,
                    price: item.price * item['CartProductModel'].quantity,
                    quantity: item['CartProductModel'].quantity,
                };
            });
        }
        return data;
    }

    private async findCart(cartId: number): Promise<CartModel> {
        const foundCart = await this.cartRepository.findCart(cartId);
        if (!foundCart) {
            this.notFound(`Корзина с id:${cartId} не найдена в БД`);
        }
        return foundCart;
    }

    private async findProduct(id: number): Promise<ProductModel> {
        const product = await this.productRepository.fidProductByPkId(id);
        if (!product) {
            this.notFound(`Продукт с id:${id} не найден в БД`);
        }
        return product;
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
