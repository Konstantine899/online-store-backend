import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryModel } from './category-model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryRepository } from './category.repository';
import { CreateCategoryResponse } from './responses/create-category.response';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  public async createCategory(
	dto: CreateCategoryDto,
  ): Promise<CreateCategoryResponse> {
	return this.categoryRepository.createCategory(dto);
  }

  public async getListAllCategories(): Promise<CategoryModel[]> {
	const categories = await this.categoryRepository.findListAllCategories();
	if (!categories) {
		this.notFound('Категории товаров не найдены');
	}
	return categories;
  }

  public async getCategory(id: number): Promise<CategoryModel> {
	const category = await this.categoryRepository.findCategory(id);
	if (!category) {
		this.notFound('Категория товара не найдена');
	}
	return category;
  }

  public async updateCategory(
	id: number,
	dto: CreateCategoryDto,
  ): Promise<CategoryModel> {
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
