import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BrandModel } from '@app/domain/models';
import { BrandDto } from '@app/infrastructure/dto';
import {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
} from '@app/infrastructure/responses';
import { IBrandRepository } from '@app/domain/repositories';
import { ListAllBrandsByCategoryResponse } from '@app/infrastructure/responses/brand/ListAllBrandsByCategoryResponse';

@Injectable()
export class BrandRepository implements IBrandRepository {
    constructor(
        @InjectModel(BrandModel) private brandModel: typeof BrandModel,
    ) {}

    public async createBrand(dto: BrandDto): Promise<CreateBrandResponse> {
        const brand = new BrandModel();
        brand.name = dto.name;
        brand.category_id = dto.category_id;
        await brand.save();
        return brand;
    }

    public async findListAllBrands(): Promise<ListAllBrandsResponse[]> {
        return this.brandModel.findAll();
    }

    public async findListAllBrandsByCategory(
        categoryId: number,
    ): Promise<ListAllBrandsByCategoryResponse[]> {
        return this.brandModel.findAll({ where: { category_id: categoryId } });
    }

    public async findBrand(id: number): Promise<BrandResponse> {
        return this.brandModel.findByPk(id);
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
        return this.brandModel.destroy({ where: { id } });
    }
}
