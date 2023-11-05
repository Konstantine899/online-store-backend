import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from '@app/infrastructure/dto';
import { BrandRepository } from '@app/infrastructure/repositories';
import {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
    RemoveBrandResponse,
} from '@app/infrastructure/responses';
import { IBrandService } from '@app/domain/services';

@Injectable()
export class BrandService implements IBrandService {
    constructor(private readonly brandRepository: BrandRepository) {}

    public async createBrand(
        dto: CreateBrandDto,
    ): Promise<CreateBrandResponse> {
        return this.brandRepository.createBrand(dto);
    }

    public async getListAllBrands(): Promise<ListAllBrandsResponse[]> {
        const brands = await this.brandRepository.findListAllBrands();
        if (!brands.length) {
            this.notFound('К сожалению по вашему запросу ничего не найдено');
        }
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
        dto: CreateBrandDto,
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
