import { ProductModel } from '../../../modules/product/product.model';

export interface ICartTransformData {
    cartId: number;
    products: ProductModel[];
}
