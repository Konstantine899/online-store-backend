import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from './category-model';
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategoryResponse } from './responses/create-category.response';
import { ListAllCategoriesResponse } from './responses/list-all-categories.response';
import { CategoryResponse } from './responses/category.response';
import { UpdateCategoryResponse } from './responses/update-category.response';

interface ICategoryRepository {
    createCategory(dto: CreateCategoryDto): Promise<CreateCategoryResponse>;

    findListAllCategories(): Promise<ListAllCategoriesResponse[]>;

    findCategory(id: number): Promise<CategoryResponse>;

    updateCategory(
        dto: CreateCategoryDto,
        category: CategoryModel,
    ): Promise<UpdateCategoryResponse>;

    removeCategory(id: number): Promise<number>;
}

@Injectable()
export class CategoryRepository implements ICategoryRepository {
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
    ): Promise<UpdateCategoryResponse> {
        return category.update({
            ...dto,
            name: dto.name,
        });
    }

    public async removeCategory(id: number): Promise<number> {
        return this.categoryModel.destroy({ where: { id } });
    }
}
