import { CreateCategoryDto } from '@app/infrastructure/dto';
import {
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    CategoryResponse,
    UpdateCategoryResponse,
    RemoveCategoryResponse,
} from '@app/infrastructure/responses';

export interface ICategoryService {
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
