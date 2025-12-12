import {
    BeforeDestroy,
    BeforeUpdate,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { CartModel } from './cart.model';
import { CART_CONSTANTS } from './constants/cart.constants';
import { ProductModel } from './product.model';

interface ICartProductModel {
    id: number;
    quantity: number;
    price: number;
    cart_id: number;
    product_id: number;
    cart: CartModel;
    product: ProductModel;
    createdAt: Date;
    updatedAt: Date;
}

interface ICartProductCreationAttributes {
    quantity: number;
    price: number;
    cart_id: number;
    product_id: number;
}

@Table({
    tableName: 'cart-product',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    // Базовые scopes
    scopes: {
        // Scope для фильтрации по корзине
        byCart: (cartId: number) => ({
            where: { cart_id: cartId },
        }),
        // Scope для загрузки с продуктом
        withProduct: {
            include: [
                {
                    model: ProductModel,
                    attributes: ['id', 'name', 'price', 'image'],
                },
            ],
        },
    },
})
export class CartProductModel extends Model<
    ICartProductModel,
    ICartProductCreationAttributes
> {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: CART_CONSTANTS.MIN_ITEM_QUANTITY,
        validate: {
            min: {
                args: [CART_CONSTANTS.MIN_ITEM_QUANTITY],
                msg: `Количество товара должно быть не меньше ${CART_CONSTANTS.MIN_ITEM_QUANTITY}`,
            },
            max: {
                args: [CART_CONSTANTS.MAX_ITEM_QUANTITY],
                msg: `Количество товара не может превышать ${CART_CONSTANTS.MAX_ITEM_QUANTITY}`,
            },
        },
    })
    quantity!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Product price snapshot at the time of adding to cart',
    })
    price!: number;

    @ForeignKey(() => CartModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    cart_id!: number;

    @ForeignKey(() => ProductModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    product_id!: number;

    @BelongsTo(() => CartModel)
    cart!: CartModel;

    // НОВОЕ ПОЛЕ - ассоциация с продуктом
    @BelongsTo(() => ProductModel)
    product!: ProductModel;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'created_at',
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'updated_at',
    })
    declare updatedAt: Date;

    // ==================== МЕТОДЫ РАБОТЫ С КОЛИЧЕСТВОМ ====================

    /**
     * Увеличить количество товара на указанное значение
     */
    incrementQuantity(amount: number = 1): void {
        if (amount < 0) {
            throw new Error(
                'Количество для увеличения должно быть положительным',
            );
        }
        const newQuantity = this.quantity + amount;
        if (!this.isValidQuantity(newQuantity)) {
            throw new Error(
                `Количество ${newQuantity} превышает максимально допустимое (${CART_CONSTANTS.MAX_ITEM_QUANTITY})`,
            );
        }
        this.quantity = newQuantity;
    }

    /**
     * Уменьшить количество товара на указанное значение
     */
    decrementQuantity(amount: number = 1): void {
        if (amount < 0) {
            throw new Error(
                'Количество для уменьшения должно быть положительным',
            );
        }
        const newQuantity = this.quantity - amount;
        if (!this.isValidQuantity(newQuantity)) {
            throw new Error(
                'Количество не может быть меньше 1. Используйте удаление товара из корзины',
            );
        }
        this.quantity = newQuantity;
    }

    /**
     * Установить конкретное количество
     */
    setQuantity(amount: number): void {
        if (!this.isValidQuantity(amount)) {
            throw new Error(
                `Количество должно быть от ${CART_CONSTANTS.MIN_ITEM_QUANTITY} до ${CART_CONSTANTS.MAX_ITEM_QUANTITY}. Получено: ${amount}`,
            );
        }
        this.quantity = amount;
    }

    /**
     * Проверка валидности количества
     */
    isValidQuantity(amount: number): boolean {
        return (
            amount >= CART_CONSTANTS.MIN_ITEM_QUANTITY &&
            amount <= CART_CONSTANTS.MAX_ITEM_QUANTITY &&
            Number.isInteger(amount)
        );
    }

    // ==================== МЕТОДЫ РАСЧЁТА СТОИМОСТИ ====================

    /**
     * Общая стоимость позиции (price * quantity)
     */
    get lineTotal(): number {
        return Number(this.price) * this.quantity;
    }

    /**
     * Сравнение snapshot цены с текущей ценой товара
     */
    isPriceChanged(currentPrice: number): boolean {
        return Number(this.price) !== currentPrice;
    }

    /**
     * Обновление price snapshot до текущей цены товара
     */
    updatePriceSnapshot(newPrice: number): void {
        if (newPrice < 0) {
            throw new Error('Цена не может быть отрицательной');
        }
        this.price = newPrice;
    }

    /**
     * Получение savings если текущая цена ниже snapshot
     */
    getSavings(currentPrice: number): number {
        const savings = Number(this.price) - currentPrice;
        return savings > 0 ? savings * this.quantity : 0;
    }

    /**
     * Получение markup если текущая цена выше snapshot
     */
    getMarkup(currentPrice: number): number {
        const markup = currentPrice - Number(this.price);
        return markup > 0 ? markup * this.quantity : 0;
    }

    // ==================== GETTERS ====================

    /**
     * Проверка есть ли товар в наличии (quantity > 0)
     */
    get hasStock(): boolean {
        return this.quantity > 0;
    }

    /**
     * Проверка является ли товар в единичном экземпляре
     */
    get isSingleItem(): boolean {
        return this.quantity === 1;
    }

    /**
     * Процент от максимально допустимого количества
     */
    get quantityPercentage(): number {
        return (this.quantity / CART_CONSTANTS.MAX_ITEM_QUANTITY) * 100;
    }

    // ==================== HOOKS ДЛЯ АВТОМАТИЧЕСКОГО ПЕРЕСЧЁТА ====================

    /**
     * Hook перед обновлением товара - автоматически пересчитываем корзину
     * (с поддержкой transaction context для предотвращения race conditions)
     */
    @BeforeUpdate
    static async recalculateCartOnUpdate(
        instance: CartProductModel,
    ): Promise<void> {
        // Если изменилось количество или цена - пересчитываем корзину
        if (instance.changed('quantity') || instance.changed('price')) {
            // Получаем transaction из контекста Sequelize
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transaction = (instance as any)._options?.transaction;

            const cart = await CartModel.findByPk(instance.cart_id, {
                transaction,
            });

            if (cart) {
                await cart.recalculateTotal(transaction);
            }
        }
    }

    /**
     * Hook перед удалением товара - автоматически пересчитываем корзину
     * (с поддержкой transaction context для предотвращения race conditions)
     */
    @BeforeDestroy
    static async recalculateCartOnDestroy(
        instance: CartProductModel,
    ): Promise<void> {
        // Получаем transaction из контекста Sequelize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transaction = (instance as any)._options?.transaction;

        const cart = await CartModel.findByPk(instance.cart_id, {
            transaction,
        });

        if (cart) {
            await cart.recalculateTotal(transaction);
        }
    }

    // ==================== UTILITY МЕТОДЫ ====================

    /**
     * Клонирование позиции корзины в другую корзину
     */
    async cloneTo(targetCartId: number): Promise<CartProductModel> {
        const clone = await CartProductModel.create({
            cart_id: targetCartId,
            product_id: this.product_id,
            quantity: this.quantity,
            price: this.price,
        });
        return clone;
    }

    /**
     * Объединение с другой позицией того же товара
     */
    mergeWith(otherItem: CartProductModel): void {
        if (this.product_id !== otherItem.product_id) {
            throw new Error('Невозможно объединить позиции разных товаров');
        }
        const newQuantity = this.quantity + otherItem.quantity;
        if (!this.isValidQuantity(newQuantity)) {
            throw new Error(
                `Объединение превысит максимальное количество (${CART_CONSTANTS.MAX_ITEM_QUANTITY}). Текущее: ${this.quantity}, добавляется: ${otherItem.quantity}`,
            );
        }
        this.quantity = newQuantity;
    }
}
