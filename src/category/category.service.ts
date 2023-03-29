import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from './category-model';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
	@InjectModel(CategoryModel)
	private categoryRepository: typeof CategoryModel,
  ) {}

  public async create(dto: CreateCategoryDto) {
	const category = await this.categoryRepository.create(dto);
	if (!category) {
		throw new HttpException(
		'Не предвиденная ошибка',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return category;
  }

  public async findAll(): Promise<CategoryModel[]> {
	const categories = await this.categoryRepository.findAll();
	if (!categories) {
		throw new NotFoundException('Не найдено');
	}
	return categories;
  }

  public async findOne(id: number): Promise<CategoryModel> {
	const category = await this.categoryRepository.findByPk(id);
	if (!category) {
		throw new NotFoundException('Не найдено');
	}
	return category;
  }

  public async update(
	id: number,
	dto: CreateCategoryDto,
  ): Promise<CategoryModel> {
	const category = await this.categoryRepository.findByPk(id);
	if (!category) {
		throw new NotFoundException('Не найдено');
	}
	const findCategory = await category.update({ ...dto, name: dto.name });
	if (!findCategory) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return findCategory;
  }

  public async remove(id: number): Promise<boolean> {
	const category = await this.categoryRepository.findByPk(id);
	if (!category) {
		throw new NotFoundException('Не найдено');
	}
	const removeCategory = await this.categoryRepository.destroy({
		where: { id },
	});
	if (!removeCategory) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return true;
  }
}
