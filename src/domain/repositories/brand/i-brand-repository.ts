import { BrandDto } from '@app/infrastructure/dto';
import {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
} from '@app/infrastructure/responses';
import { BrandModel } from '@app/domain/models';

export interface IBrandRepository {
    createBrand(dto: BrandDto): Promise<CreateBrandResponse>;

    findListAllBrands(): Promise<ListAllBrandsResponse[]>;

    findBrand(id: number): Promise<BrandResponse>;

    updateBrand(dto: BrandDto, brand: BrandModel): Promise<UpdateBrandResponse>;

    removeBrand(id: number): Promise<number>;
}
