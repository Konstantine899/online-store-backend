import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CartModel } from '../../../domain/models/cart.model';
import { ProductModel } from '../../../modules/product/product.model';
import { CartProductModel } from '../../../domain/models/cart-product.model';

interface ICartRepository {
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

@Injectable()
export class CartRepository implements ICartRepository {
    constructor(
        @InjectModel(CartModel) private cartModel: typeof CartModel,
        @InjectModel(CartProductModel)
        private cartProductModel: typeof CartProductModel,
    ) {}

    public async findCart(cartId: number): Promise<CartModel> {
        return this.cartModel.findByPk(cartId, {
            attributes: ['id'],
            include: [
                {
                    model: ProductModel,
                    attributes: ['id', 'name', 'price'],
                },
            ],
        });
    }

    public async createCart(): Promise<CartModel> {
        return this.cartModel.create();
    }

    public async appendToCart(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel> {
        let cart = await this.cartModel.findByPk(cart_id, {
            attributes: ['id'],
            include: [
                {
                    model: ProductModel,
                    attributes: ['id', 'name', 'price'],
                },
            ],
        });

        if (!cart) {
            cart = await this.cartModel.create();
        }

        const cart_product = await this.cartProductModel.findOne({
            where: {
                cart_id,
                product_id,
            },
        });

        if (cart_product) {
            await cart_product.increment('quantity', { by: quantity });
        }
        await this.cartProductModel.create({
            cart_id,
            product_id,
            quantity,
        });
        await cart.reload();
        return cart;
    }

    public async increment(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel> {
        let cart = await this.cartModel.findByPk(cart_id, {
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                },
            ],
        });
        if (!cart) {
            cart = await this.cartModel.create();
        }

        const cart_product = await this.cartProductModel.findOne({
            where: {
                cart_id,
                product_id,
            },
        });
        if (cart_product) {
            await cart_product.increment('quantity', { by: quantity });
            await cart.reload();
        }
        return cart;
    }

    public async decrement(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel> {
        let cart = await this.cartModel.findByPk(cart_id, {
            include: {
                model: ProductModel,
                as: 'products',
            },
        });
        if (!cart) {
            cart = await this.cartModel.create();
        }

        const cart_product = await this.cartProductModel.findOne({
            where: {
                cart_id,
                product_id,
            },
        });
        // Если продукт в корзине не найден удаляем его из таблицы CartProductModel
        if (!cart_product) {
            await cart_product.destroy();
        }
        // если количество продуктов в корзине больше переданного количества,
        // то уменьшаем количество товаров в корзине
        if (cart_product.quantity > quantity) {
            await cart_product.decrement('quantity', { by: quantity });
        }
        // Обновляю объект корзины, что бы подтянуть обновленные данные
        await cart.reload();
        return cart;
    }

    public async removeFromCart(
        cart_id: number,
        product_id: number,
    ): Promise<CartModel> {
        const cart = await this.cartModel.findByPk(cart_id, {
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                },
            ],
        });
        if (!cart) {
            await this.cartModel.create();
        }
        const cart_product = await this.cartProductModel.findOne({
            where: {
                cart_id,
                product_id,
            },
        });
        if (cart_product) {
            await cart_product.destroy();
            await cart.reload();
        }
        return cart;
    }

    public async clearCart(cart_id: number): Promise<CartModel> {
        let cart = await this.cartModel.findByPk(cart_id, {
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                },
            ],
        });
        if (!cart) {
            cart = await this.cartModel.create();
        }
        await this.cartProductModel.destroy({ where: { cart_id } });
        await cart.reload();
        return cart;
    }
}
