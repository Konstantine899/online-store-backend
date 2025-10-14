import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CartModel, ProductModel, CartProductModel } from '@app/domain/models';
import { ICartRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';

@Injectable()
export class CartRepository implements ICartRepository {
    constructor(
        @InjectModel(CartModel) private cartModel: typeof CartModel,
        @InjectModel(CartProductModel)
        private cartProductModel: typeof CartProductModel,
        private readonly tenantContext: TenantContext,
    ) {}

    public async findCart(cartId: number): Promise<CartModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.cartModel.findOne({
            where: {
                id: cartId,
                tenant_id: tenantId,
            } as any,
            attributes: ['id'],
            include: [
                {
                    model: ProductModel,
                    attributes: ['id', 'name', 'price'],
                },
            ],
        }) as Promise<CartModel>;
    }

    public async createCart(): Promise<CartModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.cartModel.create({ tenant_id: tenantId } as any);
    }

    public async appendToCart(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        let cart = await this.cartModel.findOne({
            where: {
                id: cart_id,
                tenant_id: tenantId,
            } as any,
            attributes: ['id'],
            include: [
                {
                    model: ProductModel,
                    attributes: ['id', 'name', 'price'],
                },
            ],
        });

        if (!cart) {
            cart = await this.cartModel.create({ tenant_id: tenantId } as any);
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
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        await cart.reload();
        return cart;
    }

    public async increment(
        cart_id: number,
        product_id: number,
        quantity: number,
    ): Promise<CartModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        let cart = await this.cartModel.findOne({
            where: {
                id: cart_id,
                tenant_id: tenantId,
            } as any,
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                },
            ],
        });
        if (!cart) {
            cart = await this.cartModel.create({ tenant_id: tenantId } as any);
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
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        let cart = await this.cartModel.findOne({
            where: {
                id: cart_id,
                tenant_id: tenantId,
            } as any,
            include: {
                model: ProductModel,
                as: 'products',
            },
        });
        if (!cart) {
            cart = await this.cartModel.create({ tenant_id: tenantId } as any);
        }

        const cart_product = await this.cartProductModel.findOne({
            where: {
                cart_id,
                product_id,
            },
        });
        // Если продукт в корзине не найден удаляем его из таблицы CartProductModel
        if (!cart_product) {
            return cart;
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
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const cart = await this.cartModel.findOne({
            where: {
                id: cart_id,
                tenant_id: tenantId,
            } as any,
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                },
            ],
        });
        if (!cart) {
            return await this.cartModel.create({ tenant_id: tenantId } as any);
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
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        let cart = await this.cartModel.findOne({
            where: {
                id: cart_id,
                tenant_id: tenantId,
            } as any,
            include: [
                {
                    model: ProductModel,
                    as: 'products',
                },
            ],
        });
        if (!cart) {
            cart = await this.cartModel.create({ tenant_id: tenantId } as any);
        }
        await this.cartProductModel.destroy({ where: { cart_id } });
        await cart.reload();
        return cart;
    }
}
