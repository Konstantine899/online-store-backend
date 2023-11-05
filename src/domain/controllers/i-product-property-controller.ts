import { CreateProductPropertyDto } from '@app/infrastructure/dto';
import { CreateProductPropertyResponse } from '../../infrastructure/responses/product-property/create-product-property.response';
import { GetProductPropertyResponse } from '../../infrastructure/responses/product-property/get-product-property.response';
import { GetListProductPropertyResponse } from '../../infrastructure/responses/product-property/get-list-product-property.response';
import { UpdateProductPropertyResponse } from '../../infrastructure/responses/product-property/update-product-property.response';
import { RemoveProductPropertyResponse } from '../../infrastructure/responses/product-property/remove-product-property.response';

export interface IProductPropertyController {
    createProductProperty(
        productId: number,
        dto: CreateProductPropertyDto,
    ): Promise<CreateProductPropertyResponse>;

    getProductProperty(
        productId: number,
        id: number,
    ): Promise<GetProductPropertyResponse>;

    getListProductProperty(
        productId: number,
    ): Promise<GetListProductPropertyResponse[]>;

    updateProductProperty(
        productId: number,
        id: number,
        dto: CreateProductPropertyDto,
    ): Promise<UpdateProductPropertyResponse>;

    removeProductProperty(
        productId: number,
        id: number,
    ): Promise<RemoveProductPropertyResponse>;
}
