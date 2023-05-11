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
import { BrandModel } from './brand.model';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateBrandDocumentation } from './decorators/create-brand.documentation';

@ApiTags(`Бренд`)
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @CreateBrandDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/create')
  public async createBrand(@Body() dto: CreateBrandDto): Promise<BrandModel> {
    return this.brandService.createBrand(dto);
  }
  @Get('/all')
  @HttpCode(200)
  public async getAll(): Promise<BrandModel[]> {
    return this.brandService.findAllBrands();
  }

  @Get('/one/:id([0-9]+)')
  @HttpCode(200)
  public async getOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BrandModel> {
    return this.brandService.findOneBrand(id);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('/update/:id([0-9]+)')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateBrandDto,
  ): Promise<BrandModel> {
    return this.brandService.updateBrand(id, dto);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/delete/:id([0-9]+)')
  public async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.brandService.remove(id);
  }
}
