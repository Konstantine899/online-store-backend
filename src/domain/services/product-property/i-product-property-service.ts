import { CreateProductPropertyDto } from '@app/infrastructure/dto';
import {
    CreateProductPropertyResponse,
    GetProductPropertyResponse,
    GetListProductPropertyResponse,
    RemoveProductPropertyResponse,
} from '@app/infrastructure/responses';
import { ProductPropertyModel } from '@app/domain/models';

export interface IProductPropertyService {
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
    ): Promise<ProductPropertyModel>;

    removeProductProperty(
        productId: number,
        id: number,
    ): Promise<RemoveProductPropertyResponse>;
}
