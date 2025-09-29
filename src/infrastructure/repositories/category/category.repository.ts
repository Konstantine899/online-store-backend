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

    /**
     * Локальный маппер ORM-модели в контракт ответа
     */
    private mapCategory(model: CategoryModel): any {
        const json = model.toJSON() as any;
        return {
            id: json.id,
            name: json.name,
            image: json.image,
            createdAt: new Date(json.createdAt).toISOString(),
            updatedAt: new Date(json.updatedAt).toISOString(),
        };
    }

    public async createCategory(
        dto: CreateCategoryDto,
        imageName: string,
    ): Promise<CreateCategoryResponse> {
        const category = await this.categoryModel.create({ name: dto.name, image: imageName });
        return this.mapCategory(category) as unknown as CreateCategoryResponse;
    }

    public async findListAllCategories(): Promise<ListAllCategoriesResponse[]> {
        const list = await this.categoryModel.findAll();
        return list.map((c) => this.mapCategory(c)) as unknown as ListAllCategoriesResponse[];
    }

    public async findCategory(id: number): Promise<CategoryResponse> {
        const found = await this.categoryModel.findByPk(id);
        return this.mapCategory(found as CategoryModel) as unknown as CategoryResponse;
    }

    public async updateCategory(
        dto: CreateCategoryDto,
        category: CategoryModel,
        updatedNameImage: string,
    ): Promise<UpdateCategoryResponse> {
        const updated = await category.update({
            ...dto,
            name: dto.name,
            image: updatedNameImage,
        });
        return this.mapCategory(updated) as unknown as UpdateCategoryResponse;
    }

    public async removeCategory(id: number): Promise<number> {
        return this.categoryModel.destroy({ where: { id } });
    }
}
