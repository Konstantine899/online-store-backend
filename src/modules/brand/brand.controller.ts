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
import { CreateBrandDocumentation } from './decorators/create-brand.documentation';
import { GetListAllBrandsDocumentation } from './decorators/get-list-all-brands.documentation';
import { GetBrandDocumentation } from './decorators/get-brand.documentation';
import { UpdateBrandDocumentation } from './decorators/update-brand.documentation';
import { RemoveBrandDocumentation } from './decorators/remove-brand.documentation';
import { CreateBrandResponse } from './responses/create-brand.response';
import { ListAllBrandsResponse } from './responses/list-all-brands.response';
import { BrandResponse } from './responses/brand.response';
import { UpdateBrandResponse } from './responses/update-brand.response';
import { RemoveBrandResponse } from './responses/remove-brand.response';

@ApiTags('Бренд')
@Controller('brand')
export class BrandController {
    constructor(private readonly brandService: BrandService) {}

    @CreateBrandDocumentation()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Post('/create')
    public async createBrand(
        @Body() dto: CreateBrandDto,
    ): Promise<CreateBrandResponse> {
        return this.brandService.createBrand(dto);
    }

    @GetListAllBrandsDocumentation()
    @HttpCode(200)
    @Get('/brands')
    public async getListAllBrands(): Promise<ListAllBrandsResponse[]> {
        return this.brandService.getListAllBrands();
    }

    @GetBrandDocumentation()
    @HttpCode(200)
    @Get('/one/:id([0-9]+)')
    public async getBrand(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BrandResponse> {
        return this.brandService.getBrand(id);
    }

    @UpdateBrandDocumentation()
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

    @RemoveBrandDocumentation()
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
