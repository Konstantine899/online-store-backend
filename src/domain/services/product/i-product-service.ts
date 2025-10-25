import type {
    CreateProductDto,
    SearchDto,
    SortingDto,
} from '@app/infrastructure/dto';
import type {
    CreateProductResponse,
    GetProductResponse,
    RemoveProductResponse,
    UpdateProductResponse,
    GetListProductV2Response,
    PaginatedResponse,
} from '@app/infrastructure/responses';
import type { ProductInfo } from '@app/infrastructure/paginate';

export interface IProductService {
    productCreate(
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

    removeProduct(id: number): Promise<RemoveProductResponse>;

    updateProduct(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse>;
}
