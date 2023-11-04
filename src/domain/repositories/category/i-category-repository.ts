import { CreateCategoryDto } from '../../../infrastructure/dto/category/create-category.dto';
import { CreateCategoryResponse } from '../../../infrastructure/responses/category/create-category.response';
import { ListAllCategoriesResponse } from '../../../infrastructure/responses/category/list-all-categories.response';
import { CategoryResponse } from '../../../infrastructure/responses/category/category.response';
import { CategoryModel } from '@app/domain/models';
import { UpdateCategoryResponse } from '../../../infrastructure/responses/category/update-category.response';

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
