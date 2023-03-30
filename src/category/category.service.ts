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
	const category = await this.categoryRepository.createCategory(dto);
	if (!category) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При создании категории товара возник конфликт',
		});
	}
	return category;
  }

  public async findAllCategories(): Promise<CategoryModel[]> {
	const categories = await this.categoryRepository.findAllCategories();
	if (!categories) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Категории товаров не найдены',
		});
	}
	return categories;
  }

  public async findOneCategory(id: number): Promise<CategoryModel> {
	const category = await this.categoryRepository.findOneCategory(id);
	if (!category) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Категория товара не найдена',
		});
	}
	return category;
  }

  public async updateCategory(
	id: number,
	dto: CreateCategoryDto,
  ): Promise<CategoryModel> {
	const category = await this.findOneCategory(id);
	const updatedCategory = await this.categoryRepository.updateCategory(
		dto,
		category,
	);
	if (!updatedCategory) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При обновлении категории произошел конфликт',
		});
	}
	return updatedCategory;
  }

  public async remove(id: number): Promise<boolean> {
	await this.findOneCategory(id);
	const removeCategory = await this.categoryRepository.removeCategory(id);
	if (!removeCategory) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При удалении категории товара произошел конфликт',
		});
	}
	return true;
  }
}
