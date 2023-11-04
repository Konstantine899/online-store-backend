import { CreateBrandDto } from '@app/infrastructure/dto';
import { CreateBrandResponse } from '../../../infrastructure/responses/brand/create-brand.response';
import { ListAllBrandsResponse } from '../../../infrastructure/responses/brand/list-all-brands.response';
import { BrandResponse } from '../../../infrastructure/responses/brand/brand.response';
import { UpdateBrandResponse } from '../../../infrastructure/responses/brand/update-brand.response';
import { RemoveBrandResponse } from '../../../infrastructure/responses/brand/remove-brand.response';

export interface IBrandService {
    createBrand(dto: CreateBrandDto): Promise<CreateBrandResponse>;

    getListAllBrands(): Promise<ListAllBrandsResponse[]>;

    getBrand(id: number): Promise<BrandResponse>;

    updateBrand(id: number, dto: CreateBrandDto): Promise<UpdateBrandResponse>;

    removeBrand(id: number): Promise<RemoveBrandResponse>;
}
