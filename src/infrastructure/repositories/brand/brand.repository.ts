import { BrandModel } from '@app/domain/models';
import { IBrandRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { BrandDto } from '@app/infrastructure/dto';
import {
    BrandResponse,
    CreateBrandResponse,
    ListAllBrandsResponse,
    UpdateBrandResponse,
} from '@app/infrastructure/responses';
import { ListAllBrandsByCategoryResponse } from '@app/infrastructure/responses/brand/ListAllBrandsByCategoryResponse';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class BrandRepository implements IBrandRepository {
    constructor(
        @InjectModel(BrandModel) private brandModel: typeof BrandModel,
        private readonly tenantContext: TenantContext,
    ) {}

    public async createBrand(dto: BrandDto): Promise<CreateBrandResponse> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const brand = new BrandModel();
        brand.name = dto.name;
        brand.category_id = dto.category_id;
        (brand as any).tenant_id = tenantId;
        await brand.save();
        return brand;
    }

    public async findListAllBrands(): Promise<ListAllBrandsResponse[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.brandModel.findAll({
            where: { tenant_id: tenantId },
        });
    }

    public async findListAllBrandsByCategory(
        categoryId: number,
    ): Promise<ListAllBrandsByCategoryResponse[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.brandModel.findAll({
            where: {
                category_id: categoryId,
                tenant_id: tenantId,
            },
        });
    }

    public async findBrand(id: number): Promise<BrandResponse> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.brandModel.findOne({
            where: {
                id,
                tenant_id: tenantId,
            },
        }) as Promise<BrandResponse>;
    }

    public async updateBrand(
        dto: BrandDto,
        brand: BrandModel,
    ): Promise<UpdateBrandResponse> {
        return brand.update({
            ...dto,
            name: dto.name,
        });
    }

    public async removeBrand(id: number): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.brandModel.destroy({
            where: {
                id,
                tenant_id: tenantId,
            },
        });
    }
}
