import type { CreateProductPropertyDto } from '@app/infrastructure/dto';
import type {
    CreateProductPropertyResponse,
    GetListProductPropertyResponse,
    GetProductPropertyResponse,
    UpdateProductPropertyResponse,
} from '@app/infrastructure/responses';
import type { ProductPropertyModel } from '@app/domain/models';

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
