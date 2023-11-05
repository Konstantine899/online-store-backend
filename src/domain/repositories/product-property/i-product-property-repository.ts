import { CreateProductPropertyDto } from '@app/infrastructure/dto';
import {
    CreateProductPropertyResponse,
    GetListProductPropertyResponse,
    GetProductPropertyResponse,
    UpdateProductPropertyResponse,
} from '@app/infrastructure/responses';
import { ProductPropertyModel } from '@app/domain/models';

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
