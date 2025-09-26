import {
    CreateProductDto,
    SearchDto,
    SortingDto,
} from '@app/infrastructure/dto';
import {
    CreateProductResponse,
    GetProductResponse,
    UpdateProductResponse,
    RemoveProductResponse,
    GetListProductV2Response,
    PaginatedResponse,
} from '@app/infrastructure/responses';
import { ProductInfo } from '@app/infrastructure/paginate';

export interface IProductController {
    create(
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<CreateProductResponse>;

    getProduct(id: number): Promise<GetProductResponse>;

    // V2 методы с новым форматом { data, meta }
    getListProductV2(
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductV2Response>;

    getListProductByBrandIdV2(
        brandId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<PaginatedResponse<ProductInfo>>;

    getListProductByCategoryIdV2(
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<PaginatedResponse<ProductInfo>>;

    getAllByBrandIdAndCategoryIdV2(
        brandId: number,
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<PaginatedResponse<ProductInfo>>;

    update(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse>;

    removeProduct(id: number): Promise<RemoveProductResponse>;
}
