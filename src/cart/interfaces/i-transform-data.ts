import { ProductModel } from '../../product/product.model';

export interface ITransformData {
  cartId: number;
  products: ProductModel[];
}
