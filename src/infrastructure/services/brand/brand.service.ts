import { SortingEnum } from '@app/domain/dto';
import { IBrandService } from '@app/domain/services';
import { BrandDto, SearchDto, SortingDto } from '@app/infrastructure/dto';
import { MetaData } from '@app/infrastructure/paginate';
import { BrandRepository } from '@app/infrastructure/repositories';
import {
    BrandResponse,
    CreateBrandResponse,
    ListAllBrandsResponse,
    RemoveBrandResponse,
    UpdateBrandResponse,
} from '@app/infrastructure/responses';
import { ListAllBrandsByCategoryResponse } from '@app/infrastructure/responses/brand/ListAllBrandsByCategoryResponse';
import { GetListBrandsV2Response } from '@app/infrastructure/responses/brand/get-list-brands-v2.response';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';

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

    // SAAS-003: V2 with pagination support (all brands)
    public async getListBrandsV2(
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListBrandsV2Response> {
        const { search } = searchQuery;
        const { sort = SortingEnum.DESC } = sortQuery;
        const { limit, offset } = this.getPaginate(page, size);

        const brands = await this.brandRepository.findListAllBrandsV2(
            search,
            sort,
            limit,
            offset,
        );

        const metaData = this.getMetadata(brands.count, page, limit);

        return {
            data: brands.rows,
            meta: metaData,
        };
    }

    public async getListAllBrandsByCategory(
        categoryId: number,
    ): Promise<ListAllBrandsByCategoryResponse[]> {
        const brands =
            await this.brandRepository.findListAllBrandsByCategory(categoryId);
        return brands;
    }

    // SAAS-003: V2 with pagination support (brands by category)
    public async getListBrandsByCategoryV2(
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListBrandsV2Response> {
        const { search } = searchQuery;
        const { sort = SortingEnum.DESC } = sortQuery;
        const { limit, offset } = this.getPaginate(page, size);

        const brands = await this.brandRepository.findListAllBrandsByCategoryV2(
            categoryId,
            search,
            sort,
            limit,
            offset,
        );

        const metaData = this.getMetadata(brands.count, page, limit);

        return {
            data: brands.rows,
            meta: metaData,
        };
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

    // SAAS-003: Pagination helper methods
    private getPaginate(
        page: number,
        size: number,
    ): {
        limit: number;
        offset: number;
    } {
        const limit = size;
        const correctedPage = Math.max(1, page);
        const offset = (correctedPage - 1) * limit;
        return {
            limit,
            offset,
        };
    }

    private getMetadata(count: number, page: number, limit: number): MetaData {
        return {
            totalCount: count,
            lastPage: Math.ceil(count / limit),
            currentPage: page,
            nextPage: page + 1,
            previousPage: page - 1,
            limit,
        };
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
