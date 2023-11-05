import {
    CreateProductDto,
    SearchDto,
    SortingDto,
} from '@app/infrastructure/dto';
import {
    CreateProductResponse,
    GetProductResponse,
    GetListProductResponse,
    GetListProductByBrandIdResponse,
    RemoveProductResponse,
    GetListProductByCategoryIdResponse,
    GetAllByBrandIdAndCategoryIdResponse,
    UpdateProductResponse,
} from '@app/infrastructure/responses';

export interface IProductService {
    productCreate(
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<CreateProductResponse>;

    getProduct(id: number): Promise<GetProductResponse>;

    getListProduct(
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductResponse>;

    getListProductByBrandId(
        brandId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductByBrandIdResponse>;

    getListProductByCategoryId(
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductByCategoryIdResponse>;

    getAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetAllByBrandIdAndCategoryIdResponse>;

    removeProduct(id: number): Promise<RemoveProductResponse>;

    updateProduct(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse>;
}
