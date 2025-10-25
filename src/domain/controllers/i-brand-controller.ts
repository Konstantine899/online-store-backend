import type { BrandDto } from '@app/infrastructure/dto';
import type {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
    RemoveBrandResponse,
} from '@app/infrastructure/responses';

export interface IBrandController {
    createBrand(dto: BrandDto): Promise<CreateBrandResponse>;

    getListAllBrands(): Promise<ListAllBrandsResponse[]>;

    getBrand(id: number): Promise<BrandResponse>;

    updateBrand(id: number, dto: BrandDto): Promise<UpdateBrandResponse>;

    removeBrand(id: number): Promise<RemoveBrandResponse>;
}
