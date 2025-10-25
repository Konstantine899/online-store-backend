import type { CreateCategoryDto } from '@app/infrastructure/dto';
import type {
    CreateCategoryResponse,
    CategoryResponse,
    ListAllCategoriesResponse,
    UpdateCategoryResponse,
    RemoveCategoryResponse,
} from '@app/infrastructure/responses';

export interface ICategoryController {
    createCategory(
        dto: CreateCategoryDto,
        image: Express.Multer.File,
    ): Promise<CreateCategoryResponse>;

    getListAllCategories(): Promise<ListAllCategoriesResponse[]>;

    getCategory(id: number): Promise<CategoryResponse>;

    updateCategory(
        id: number,
        dto: CreateCategoryDto,
        image: Express.Multer.File,
    ): Promise<UpdateCategoryResponse>;

    removeCategory(id: number): Promise<RemoveCategoryResponse>;
}
