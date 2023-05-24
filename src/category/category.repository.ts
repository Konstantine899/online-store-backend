import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from './category-model';
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategoryResponse } from './responses/create-category.response';
import { ListAllCategoriesResponse } from './responses/list-all-categories.response';
import { CategoryResponse } from './responses/category.response';

@Injectable()
export class CategoryRepository {
  constructor(
	@InjectModel(CategoryModel)
	private categoryModel: typeof CategoryModel,
  ) {}

  public async createCategory(
	dto: CreateCategoryDto,
  ): Promise<CreateCategoryResponse> {
	const category = new CategoryModel();
	category.name = dto.name;
	return category.save();
  }

  public async findListAllCategories(): Promise<ListAllCategoriesResponse[]> {
	return this.categoryModel.findAll();
  }

  public async findCategory(id: number): Promise<CategoryResponse> {
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
