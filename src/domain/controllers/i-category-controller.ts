import { CreateCategoryDto } from '../../infrastructure/dto/category/create-category.dto';
import { CreateCategoryResponse } from '../../infrastructure/responses/category/create-category.response';
import { ListAllCategoriesResponse } from '../../infrastructure/responses/category/list-all-categories.response';
import { CategoryResponse } from '../../infrastructure/responses/category/category.response';
import { UpdateCategoryResponse } from '../../infrastructure/responses/category/update-category.response';
import { RemoveCategoryResponse } from '../../infrastructure/responses/category/remove-category.response';

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
