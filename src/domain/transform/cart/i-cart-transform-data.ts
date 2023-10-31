import { ProductModel } from '../../models/product.model';

export interface ICartTransformData {
    cartId: number;
    products: ProductModel[];
}
