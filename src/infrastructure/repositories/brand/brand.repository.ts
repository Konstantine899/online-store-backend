import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BrandModel } from '@app/domain/models';
import { CreateBrandDto } from '../../dto/brand/create-brand.dto';
import { CreateBrandResponse } from '../../responses/brand/create-brand.response';
import { ListAllBrandsResponse } from '../../responses/brand/list-all-brands.response';
import { BrandResponse } from '../../responses/brand/brand.response';
import { UpdateBrandResponse } from '../../responses/brand/update-brand.response';
import { IBrandRepository } from '@app/domain/repositories';

@Injectable()
export class BrandRepository implements IBrandRepository {
    constructor(
        @InjectModel(BrandModel) private brandModel: typeof BrandModel,
    ) {}

    public async createBrand(
        dto: CreateBrandDto,
    ): Promise<CreateBrandResponse> {
        const brand = new BrandModel();
        brand.name = dto.name;
        await brand.save();
        return brand;
    }

    public async findListAllBrands(): Promise<ListAllBrandsResponse[]> {
        return this.brandModel.findAll();
    }

    public async findBrand(id: number): Promise<BrandResponse> {
        return this.brandModel.findByPk(id);
    }

    public async updateBrand(
        dto: CreateBrandDto,
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
