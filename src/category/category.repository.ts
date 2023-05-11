import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from './category-model';
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(
	@InjectModel(CategoryModel)
	private categoryModel: typeof CategoryModel,
  ) {}

  public async createCategory(dto: CreateCategoryDto): Promise<CategoryModel> {
	const category = new CategoryModel();
	category.name = dto.name;
	return category.save();
  }

  public async findListAllCategories(): Promise<CategoryModel[]> {
	return this.categoryModel.findAll();
  }

  public async findCategory(id: number): Promise<CategoryModel> {
	return this.categoryModel.findByPk(id);
  }

  public async updateCategory(
	dto: CreateCategoryDto,
	category: CategoryModel,
  ): Promise<CategoryModel> {
	return category.update({ ...dto, name: dto.name });
  }

  public async removeCategory(id: number): Promise<number> {
	return this.categoryModel.destroy({ where: { id } });
  }
}
