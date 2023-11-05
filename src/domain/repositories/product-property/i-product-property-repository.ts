import { CreateProductPropertyDto } from '@app/infrastructure/dto';
import { CreateProductPropertyResponse } from '../../../infrastructure/responses/product-property/create-product-property.response';
import { GetProductPropertyResponse } from '../../../infrastructure/responses/product-property/get-product-property.response';
import { GetListProductPropertyResponse } from '../../../infrastructure/responses/product-property/get-list-product-property.response';
import { ProductPropertyModel } from '@app/domain/models';
import { UpdateProductPropertyResponse } from '../../../infrastructure/responses/product-property/update-product-property.response';

export interface IProductPropertyRepository {
    create(
        product_id: number,
        dto: CreateProductPropertyDto,
    ): Promise<CreateProductPropertyResponse>;

    findOneProductProperty(
        product_id: number,
        id: number,
    ): Promise<GetProductPropertyResponse>;

    findListProductProperty(
        product_id: number,
    ): Promise<GetListProductPropertyResponse[]>;

    updateProductProperty(
        property: ProductPropertyModel,
        dto: CreateProductPropertyDto,
    ): Promise<UpdateProductPropertyResponse>;

    removeProductProperty(id: number): Promise<number>;
}
