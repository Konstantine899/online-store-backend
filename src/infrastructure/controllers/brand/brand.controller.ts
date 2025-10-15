import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { BrandService } from '@app/infrastructure/services';
import { BrandDto, SearchDto, SortingDto } from '@app/infrastructure/dto';
import {
    Roles,
    CreateBrandSwaggerDecorator,
    GetListAllBrandsSwaggerDecorator,
    GetBrandSwaggerDecorator,
    UpdateBrandSwaggerDecorator,
    RemoveBrandSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { ApiTags } from '@nestjs/swagger';
import {
    CreateBrandResponse,
    ListAllBrandsResponse,
    BrandResponse,
    UpdateBrandResponse,
    RemoveBrandResponse,
} from '@app/infrastructure/responses';
import { GetListBrandsV2Response } from '@app/infrastructure/responses/brand/get-list-brands-v2.response';
import { IBrandController } from '@app/domain/controllers';
import { ListAllBrandsByCategoryResponse } from '@app/infrastructure/responses/brand/ListAllBrandsByCategoryResponse';
import { GetBrandsByCategoryDecorator } from '@app/infrastructure/common/decorators/swagger/brand/get-brands-by-category-decorator';
import { GetListBrandsV2SwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/brand/get-list-brands-v2-swagger-decorator';
import { GetListBrandsByCategoryV2SwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/brand/get-list-brands-by-category-v2-swagger-decorator';

@ApiTags('Бренд')
@Controller('brand')
export class BrandController implements IBrandController {
    constructor(private readonly brandService: BrandService) {}

    @CreateBrandSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    public async createBrand(
        @Body() dto: BrandDto,
    ): Promise<CreateBrandResponse> {
        return this.brandService.createBrand(dto);
    }

    @GetListAllBrandsSwaggerDecorator()
    @HttpCode(200)
    @Get('/brands')
    public async getListAllBrands(): Promise<ListAllBrandsResponse[]> {
        return this.brandService.getListAllBrands();
    }

    // SAAS-003: V2 endpoint with pagination (all brands)
    @GetListBrandsV2SwaggerDecorator()
    @HttpCode(200)
    @Get('/list-v2')
    public async getListBrandsV2(
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetListBrandsV2Response> {
        return this.brandService.getListBrandsV2(searchQuery, sortQuery, page, size);
    }

    @GetBrandsByCategoryDecorator()
    @HttpCode(200)
    @Get('/brand_list_by_category/:categoryId')
    public async getListAllBrandsByCategory(
        @Param('categoryId', ParseIntPipe) categoryId: number,
    ): Promise<ListAllBrandsByCategoryResponse[]> {
        return this.brandService.getListAllBrandsByCategory(categoryId);
    }

    // SAAS-003: V2 endpoint with pagination (brands by category)
    @GetListBrandsByCategoryV2SwaggerDecorator()
    @HttpCode(200)
    @Get('/category/:categoryId/list-v2')
    public async getListBrandsByCategoryV2(
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetListBrandsV2Response> {
        return this.brandService.getListBrandsByCategoryV2(categoryId, searchQuery, sortQuery, page, size);
    }

    @GetBrandSwaggerDecorator()
    @HttpCode(200)
    @Get(':id')
    public async getBrand(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BrandResponse> {
        return this.brandService.getBrand(id);
    }

    @UpdateBrandSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Put('/update/:id')
    public async updateBrand(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: BrandDto,
    ): Promise<UpdateBrandResponse> {
        return this.brandService.updateBrand(id, dto);
    }

    @RemoveBrandSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/delete/:id')
    public async removeBrand(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveBrandResponse> {
        return this.brandService.removeBrand(id);
    }
}
