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
  UseInterceptors,
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
import { TransactionInterceptor } from '../interceptors/transaction-interceptor';
import { TransactionDecorator } from '../decorators/transaction-decorator';
import { Transaction } from 'sequelize';

@ApiTags(`Бренд`)
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @CreateBrandDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/create')
  @UseInterceptors(TransactionInterceptor)
  public async createBrand(
	@Body() dto: CreateBrandDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<CreateBrandResponse> {
	return this.brandService.createBrand(dto);
  }

  @GetListAllBrandsDocumentation()
  @HttpCode(200)
  @Get('/brands')
  @UseInterceptors(TransactionInterceptor)
  public async getListAllBrands(
	@TransactionDecorator() transaction: Transaction,
  ): Promise<ListAllBrandsResponse[]> {
	return this.brandService.getListAllBrands();
  }

  @GetBrandDocumentation()
  @HttpCode(200)
  @Get('/one/:id([0-9]+)')
  @UseInterceptors(TransactionInterceptor)
  public async getBrand(
	@Param('id', ParseIntPipe) id: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<BrandResponse> {
	return this.brandService.getBrand(id);
  }

  @UpdateBrandDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('/update/:id([0-9]+)')
  @UseInterceptors(TransactionInterceptor)
  public async updateBrand(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateBrandDto,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<UpdateBrandResponse> {
	return this.brandService.updateBrand(id, dto);
  }

  @RemoveBrandDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/delete/:id([0-9]+)')
  @UseInterceptors(TransactionInterceptor)
  public async removeBrand(
	@Param('id', ParseIntPipe) id: number,
	@TransactionDecorator() transaction: Transaction,
  ): Promise<RemoveBrandResponse> {
	return this.brandService.removeBrand(id);
  }
}
