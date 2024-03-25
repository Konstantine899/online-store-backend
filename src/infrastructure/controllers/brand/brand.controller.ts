import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { BrandService } from '@app/infrastructure/services';
import { BrandDto } from '@app/infrastructure/dto';
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
import { IBrandController } from '@app/domain/controllers';
import { ListAllBrandsByCategoryResponse } from '@app/infrastructure/responses/brand/ListAllBrandsByCategoryResponse';
import { GetBrandsByCategoryDecorator } from '@app/infrastructure/common/decorators/swagger/brand/get-brands-by-category-decorator';

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

    @GetBrandsByCategoryDecorator()
    @HttpCode(200)
    @Get('/brand_list_by_category/:categoryId')
    public async getListAllBrandsByCategory(
        @Param('categoryId', ParseIntPipe) categoryId: number,
    ): Promise<ListAllBrandsByCategoryResponse[]> {
        return this.brandService.getListAllBrandsByCategory(categoryId);
    }

    @GetBrandSwaggerDecorator()
    @HttpCode(200)
    @Get('/:id([0-9]+)')
    public async getBrand(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BrandResponse> {
        return this.brandService.getBrand(id);
    }

    @UpdateBrandSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Put('/update/:id([0-9]+)')
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
    @Delete('/delete/:id([0-9]+)')
    public async removeBrand(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveBrandResponse> {
        return this.brandService.removeBrand(id);
    }
}
