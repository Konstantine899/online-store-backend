import { CreateBrandDto } from '@app/infrastructure/dto';
import {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
    RemoveBrandResponse,
} from '@app/infrastructure/responses';

export interface IBrandService {
    createBrand(dto: CreateBrandDto): Promise<CreateBrandResponse>;

    getListAllBrands(): Promise<ListAllBrandsResponse[]>;

    getBrand(id: number): Promise<BrandResponse>;

    updateBrand(id: number, dto: CreateBrandDto): Promise<UpdateBrandResponse>;

    removeBrand(id: number): Promise<RemoveBrandResponse>;
}
