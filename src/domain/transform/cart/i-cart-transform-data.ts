import { ProductModel } from '@app/domain/models';

export interface ICartTransformData {
    cartId: number;
    products: ProductModel[];
}
