// Интерфейс для элемента корзины с дополнительной информацией
export interface ICartProductItem {
    productId: number;
    name: string;
    price: number;
    quantity: number;
}

export interface ICartTransformData {
    cartId: number;
    products: ICartProductItem[];
}
