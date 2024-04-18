import { InjectModel } from '@nestjs/sequelize';
import { CategoryModel } from '@app/domain/models';
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from '@app/infrastructure/dto';
import {
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    CategoryResponse,
    UpdateCategoryResponse,
} from '@app/infrastructure/responses';
import { ICategoryRepository } from '@app/domain/repositories';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
    constructor(
        @InjectModel(CategoryModel)
        private categoryModel: typeof CategoryModel,
    ) {}

    public async createCategory(
        dto: CreateCategoryDto,
        imageName: string,
    ): Promise<CreateCategoryResponse> {
        const category = new CategoryModel();
        category.name = dto.name;
        category.image = imageName;
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
        updatedNameImage: string,
    ): Promise<UpdateCategoryResponse> {
        return category.update({
            ...dto,
            name: dto.name,
            image: updatedNameImage,
        });
    }

    public async removeCategory(id: number): Promise<number> {
        return this.categoryModel.destroy({ where: { id } });
    }
}
