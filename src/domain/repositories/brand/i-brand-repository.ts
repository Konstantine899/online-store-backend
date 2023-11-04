import { CreateBrandDto } from '@app/infrastructure/dto';
import { CreateBrandResponse } from '../../../infrastructure/responses/brand/create-brand.response';
import { ListAllBrandsResponse } from '../../../infrastructure/responses/brand/list-all-brands.response';
import { BrandResponse } from '../../../infrastructure/responses/brand/brand.response';
import { BrandModel } from '@app/domain/models';
import { UpdateBrandResponse } from '../../../infrastructure/responses/brand/update-brand.response';

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
