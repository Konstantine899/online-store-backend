import { BrandModel } from '@app/domain/models';
import { IBrandRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { PaginationValidator } from '@app/infrastructure/common/utils/pagination-validator';
import { BrandDto } from '@app/infrastructure/dto';
import { BrandInfo } from '@app/infrastructure/paginate';
import {
    BrandResponse,
    CreateBrandResponse,
    ListAllBrandsResponse,
    UpdateBrandResponse,
} from '@app/infrastructure/responses';
import { ListAllBrandsByCategoryResponse } from '@app/infrastructure/responses/brand/ListAllBrandsByCategoryResponse';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

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
        brand.tenant_id = tenantId;
        await brand.save();
        return brand;
    }

    public async findListAllBrands(): Promise<ListAllBrandsResponse[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.brandModel.findAll({
            where: { tenant_id: tenantId },
        });
    }

    // SAAS-003: V2 with pagination support (all brands)
    public async findListAllBrandsV2(
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: BrandInfo[] }> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const where: WhereOptions<BrandModel> = { tenant_id: tenantId };

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        // SAAS-003: Validate and sanitize inputs using PaginationValidator (DRY)
        const validSort = PaginationValidator.validateSort(sort);
        const safeLimit = PaginationValidator.validateLimit(limit);
        const safeOffset = PaginationValidator.validateOffset(offset);

        return this.brandModel.findAndCountAll({
            where,
            attributes: [
                'id',
                'name',
                'slug',
                'description',
                'isActive',
                'logo',
                'category_id',
                'tenant_id',
            ],
            order: [['name', validSort]], // SAAS-003: Sort by name for alphabetical order
            limit: safeLimit,
            offset: safeOffset,
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

    // SAAS-003: V2 with pagination support (brands by category)
    public async findListAllBrandsByCategoryV2(
        categoryId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: BrandInfo[] }> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const where: WhereOptions<BrandModel> = {
            category_id: categoryId,
            tenant_id: tenantId,
        };

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        // SAAS-003: Validate and sanitize inputs using PaginationValidator (DRY)
        const validSort = PaginationValidator.validateSort(sort);
        const safeLimit = PaginationValidator.validateLimit(limit);
        const safeOffset = PaginationValidator.validateOffset(offset);

        return this.brandModel.findAndCountAll({
            where,
            attributes: [
                'id',
                'name',
                'slug',
                'description',
                'isActive',
                'logo',
                'category_id',
                'tenant_id',
            ],
            order: [['name', validSort]], // SAAS-003: Sort by name for alphabetical order
            limit: safeLimit,
            offset: safeOffset,
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
