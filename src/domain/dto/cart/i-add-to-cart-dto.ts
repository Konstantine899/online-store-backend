/**
 * DTO для добавления товара в корзину
 */
export interface IAddToCartDto {
    /**
     * ID товара
     */
    productId: number;

    /**
     * Количество товара
     */
    quantity: number;
}
