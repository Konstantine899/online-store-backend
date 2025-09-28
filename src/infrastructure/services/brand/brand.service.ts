import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { BrandDto } from '@app/infrastructure/dto';
import { BrandRepository } from '@app/infrastructure/repositories';
import {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
    RemoveBrandResponse,
} from '@app/infrastructure/responses';
import { IBrandService } from '@app/domain/services';
import { ListAllBrandsByCategoryResponse } from '@app/infrastructure/responses/brand/ListAllBrandsByCategoryResponse';

@Injectable()
export class BrandService implements IBrandService {
    constructor(private readonly brandRepository: BrandRepository) {}

    public async createBrand(dto: BrandDto): Promise<CreateBrandResponse> {
        return this.brandRepository.createBrand(dto);
    }

    public async getListAllBrands(): Promise<ListAllBrandsResponse[]> {
        const brands = await this.brandRepository.findListAllBrands();
        return brands;
    }

    public async getListAllBrandsByCategory(
        categoryId: number,
    ): Promise<ListAllBrandsByCategoryResponse[]> {
        const brands = await this.brandRepository.findListAllBrandsByCategory(categoryId);
        return brands;
    }

    public async getBrand(id: number): Promise<BrandResponse> {
        const brand = await this.brandRepository.findBrand(id);
        if (!brand) {
            this.notFound('Бренд не найден');
        }
        return brand;
    }

    public async updateBrand(
        id: number,
        dto: BrandDto,
    ): Promise<UpdateBrandResponse> {
        const brand = await this.getBrand(id);
        return this.brandRepository.updateBrand(dto, brand);
    }

    public async removeBrand(id: number): Promise<RemoveBrandResponse> {
        const brand = await this.getBrand(id);
        await this.brandRepository.removeBrand(brand.id);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
