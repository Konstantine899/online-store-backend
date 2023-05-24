import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryRepository } from './category.repository';
import { CreateCategoryResponse } from './responses/create-category.response';
import { ListAllCategoriesResponse } from './responses/list-all-categories.response';
import { CategoryResponse } from './responses/category.response';
import { UpdateCategoryResponse } from './responses/update-category.response';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  public async createCategory(
	dto: CreateCategoryDto,
  ): Promise<CreateCategoryResponse> {
	return this.categoryRepository.createCategory(dto);
  }

  public async getListAllCategories(): Promise<ListAllCategoriesResponse[]> {
	const categories = await this.categoryRepository.findListAllCategories();
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

  public async removeCategory(id: number): Promise<number> {
	const category = await this.getCategory(id);
	if (!category) {
		this.notFound('Категория товара не найдена');
	}
	return this.categoryRepository.removeCategory(category.id);
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
