import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from '../../dto/category/create-category.dto';
import { CategoryRepository } from '../../repositories/category/category.repository';
import { CreateCategoryResponse } from '../../responses/category/create-category.response';
import { ListAllCategoriesResponse } from '../../responses/category/list-all-categories.response';
import { CategoryResponse } from '../../responses/category/category.response';
import { UpdateCategoryResponse } from '../../responses/category/update-category.response';
import { RemoveCategoryResponse } from '../../responses/category/remove-category.response';
import { ICategoryService } from '../../../domain/services/category/i-category-service';

@Injectable()
export class CategoryService implements ICategoryService {
    constructor(private readonly categoryRepository: CategoryRepository) {}

    public async createCategory(
        dto: CreateCategoryDto,
    ): Promise<CreateCategoryResponse> {
        return this.categoryRepository.createCategory(dto);
    }

    public async getListAllCategories(): Promise<ListAllCategoriesResponse[]> {
        const categories =
            await this.categoryRepository.findListAllCategories();
        if (!categories) {
            this.notFound('Категории товаров не найдены');
        }
        return categories;
    }

    public async getCategory(id: number): Promise<CategoryResponse> {
        const category = await this.categoryRepository.findCategory(id);
        if (!category) {
            this.notFound('Категория товара не найдена');
        }
        return category;
    }

    public async updateCategory(
        id: number,
        dto: CreateCategoryDto,
    ): Promise<UpdateCategoryResponse> {
        const category = await this.getCategory(id);
        return this.categoryRepository.updateCategory(dto, category);
    }

    public async removeCategory(id: number): Promise<RemoveCategoryResponse> {
        const category = await this.getCategory(id);
        if (!category) {
            this.notFound('Категория товара не найдена');
        }
        await this.categoryRepository.removeCategory(category.id);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
