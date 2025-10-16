/**
 * DTO для обновления количества товара в корзине
 */
export interface IUpdateCartItemDto {
    /**
     * ID товара
     */
    productId: number;

    /**
     * Изменение количества (может быть положительным или отрицательным)
     */
    amount: number;
}
