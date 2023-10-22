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
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateBrandSwaggerDecorator } from './decorators/swagger/create-brand-swagger-decorator';
import { GetListAllBrandsSwaggerDecorator } from './decorators/swagger/get-list-all-brands-swagger-decorator';
import { GetBrandSwaggerDecorator } from './decorators/swagger/get-brand-swagger-decorator';
import { UpdateBrandSwaggerDecorator } from './decorators/swagger/update-brand-swagger-decorator';
import { RemoveBrandSwaggerDecorator } from './decorators/swagger/remove-brand-swagger-decorator';
import { CreateBrandResponse } from './responses/create-brand.response';
import { ListAllBrandsResponse } from './responses/list-all-brands.response';
import { BrandResponse } from './responses/brand.response';
import { UpdateBrandResponse } from './responses/update-brand.response';
import { RemoveBrandResponse } from './responses/remove-brand.response';

@ApiTags('Бренд')
@Controller('brand')
export class BrandController {
    constructor(private readonly brandService: BrandService) {}

    @CreateBrandSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
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
    @UseGuards(JwtGuard, RoleGuard)
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
    @UseGuards(JwtGuard, RoleGuard)
    @Delete('/delete/:id([0-9]+)')
    public async removeBrand(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveBrandResponse> {
        return this.brandService.removeBrand(id);
    }
}
