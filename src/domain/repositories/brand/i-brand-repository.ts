import { CreateBrandDto } from '@app/infrastructure/dto';
import {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
} from '@app/infrastructure/responses';
import { BrandModel } from '@app/domain/models';

export interface IBrandRepository {
    createBrand(dto: CreateBrandDto): Promise<CreateBrandResponse>;

    findListAllBrands(): Promise<ListAllBrandsResponse[]>;

    findBrand(id: number): Promise<BrandResponse>;

    updateBrand(
        dto: CreateBrandDto,
        brand: BrandModel,
    ): Promise<UpdateBrandResponse>;

    removeBrand(id: number): Promise<number>;
}
