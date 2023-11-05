import { CreateCategoryDto } from '@app/infrastructure/dto';
import {
    CreateCategoryResponse,
    CategoryResponse,
    ListAllCategoriesResponse,
    UpdateCategoryResponse,
    RemoveCategoryResponse,
} from '@app/infrastructure/responses';

export interface ICategoryController {
    createCategory(dto: CreateCategoryDto): Promise<CreateCategoryResponse>;

    getListAllCategories(): Promise<ListAllCategoriesResponse[]>;

    getCategory(id: number): Promise<CategoryResponse>;

    updateCategory(
        id: number,
        dto: CreateCategoryDto,
    ): Promise<UpdateCategoryResponse>;

    removeCategory(id: number): Promise<RemoveCategoryResponse>;
}
