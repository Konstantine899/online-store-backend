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
import { BrandService } from '../../services/brand/brand.service';
import { CreateBrandDto } from '@app/infrastructure/dto';
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
import { CreateBrandResponse } from '../../responses/brand/create-brand.response';
import { ListAllBrandsResponse } from '../../responses/brand/list-all-brands.response';
import { BrandResponse } from '../../responses/brand/brand.response';
import { UpdateBrandResponse } from '../../responses/brand/update-brand.response';
import { RemoveBrandResponse } from '../../responses/brand/remove-brand.response';
import { IBrandController } from '@app/domain/controllers';

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
        @Body() dto: CreateBrandDto,
    ): Promise<CreateBrandResponse> {
        return this.brandService.createBrand(dto);
    }

    @GetListAllBrandsSwaggerDecorator()
    @HttpCode(200)
    @Get('/brands')
    public async getListAllBrands(): Promise<ListAllBrandsResponse[]> {
        return this.brandService.getListAllBrands();
    }

    @GetBrandSwaggerDecorator()
    @HttpCode(200)
    @Get('/one/:id([0-9]+)')
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
        @Body() dto: CreateBrandDto,
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
