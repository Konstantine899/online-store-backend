import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryModel } from './category-model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  public async createCategory(dto: CreateCategoryDto): Promise<CategoryModel> {
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

  public async remove(id: number): Promise<boolean> {
	await this.getCategory(id);
	const removeCategory = await this.categoryRepository.removeCategory(id);
	if (!removeCategory) {
		this.conflict('При удалении категории товара произошел конфликт');
	}

	return true;
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }

  private conflict(message: string): void {
	throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message,
	});
  }
}
