import type { CreateProductPropertyDto } from '@app/infrastructure/dto';
import type {
    CreateProductPropertyResponse,
    GetProductPropertyResponse,
    GetListProductPropertyResponse,
    UpdateProductPropertyResponse,
    RemoveProductPropertyResponse,
} from '@app/infrastructure/responses';

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
