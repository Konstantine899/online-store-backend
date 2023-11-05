import { CreateCategoryDto } from '@app/infrastructure/dto';
import {
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    CategoryResponse,
    UpdateCategoryResponse,
} from '@app/infrastructure/responses';
import { CategoryModel } from '@app/domain/models';

export interface ICategoryRepository {
    createCategory(dto: CreateCategoryDto): Promise<CreateCategoryResponse>;

    findListAllCategories(): Promise<ListAllCategoriesResponse[]>;

    findCategory(id: number): Promise<CategoryResponse>;

    updateCategory(
        dto: CreateCategoryDto,
        category: CategoryModel,
    ): Promise<UpdateCategoryResponse>;

    removeCategory(id: number): Promise<number>;
}
