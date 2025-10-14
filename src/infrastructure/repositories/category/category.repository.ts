import { CategoryModel } from '@app/domain/models';
import { ICategoryRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { CreateCategoryDto } from '@app/infrastructure/dto';
import {
    CategoryResponse,
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    UpdateCategoryResponse,
} from '@app/infrastructure/responses';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
    constructor(
        @InjectModel(CategoryModel)
        private categoryModel: typeof CategoryModel,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Локальный маппер ORM-модели в контракт ответа
     */
    private mapCategory(model: CategoryModel): CategoryResponse {
        return {
            id: model.id,
            name: model.name,
            image: model.image ?? '',
        } as CategoryResponse;
    }

    public async createCategory(
        dto: CreateCategoryDto,
        imageName: string,
    ): Promise<CreateCategoryResponse> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const category = await this.categoryModel.create({
            name: dto.name,
            image: imageName,
            tenant_id: tenantId,
        } as any);
        return this.mapCategory(category);
    }

    public async findListAllCategories(): Promise<ListAllCategoriesResponse[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const list = await this.categoryModel.findAll({
            where: { tenant_id: tenantId },
        });
        return list.map((c) => this.mapCategory(c));
    }

    public async findCategory(id: number): Promise<CategoryResponse> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const found = await this.categoryModel.findOne({
            where: {
                id,
                tenant_id: tenantId,
            },
        });
        return (found
            ? this.mapCategory(found)
            : null) as unknown as CategoryResponse;
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
        return this.mapCategory(updated) as UpdateCategoryResponse;
    }

    public async removeCategory(id: number): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.categoryModel.destroy({
            where: {
                id,
                tenant_id: tenantId,
            },
        });
    }
}
