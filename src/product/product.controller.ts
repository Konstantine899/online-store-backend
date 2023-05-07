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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { IGetMetadata, ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductModel } from './product.model';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { imageMulterOptions } from '../file/image-multer.options';
import { ProductCreateDocumentation } from './decorators/product-create.documentation';
import { ApiTags } from '@nestjs/swagger';
import { GetProductDocumentation } from './decorators/get-product.documentation';
import { SearchQueryDto } from './dto/search-query.dto';
import { SortQueryDto } from './dto/sort-query.dto';
import { GetListAllProductsDocumentation } from './decorators/get-list-all-products.documentation';
import { GetListAllProductsByBrandDocumentation } from './decorators/get-list-all-products-by-brand.documentation';
import { GetListAllProductsByCategoryDocumentation } from './decorators/get-list-all-products-by-category.documentation';
import { GetListAllProductsByBrandAndCategoryDocumentation } from './decorators/get-list-all-products-by-brand-and-category.documentation';

export interface IProductsResponse {
  metaData: IGetMetadata;
  rows: ProductModel[];
}

@ApiTags(`Продукт`)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @ProductCreateDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/create')
  @UseInterceptors(FileInterceptor('image', imageMulterOptions))
  public async create(
	@Body() dto: CreateProductDto,
	@UploadedFile()
	image: Express.Multer.File,
  ): Promise<ProductModel> {
	return this.productService.productCreate(dto, image);
  }

  @GetProductDocumentation()
  @HttpCode(200)
  @Get('/one/:id([0-9]+)')
  public async getProduct(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<ProductModel> {
	return this.productService.getProduct(id);
  }

  @GetListAllProductsDocumentation()
  @HttpCode(200)
  @Get('/all')
  public async getListAllProducts(
	@Query() searchQuery: SearchQueryDto,
	@Query() sortQuery: SortQueryDto,
	@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
	@Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
  ): Promise<IProductsResponse> {
	return this.productService.getListAllProducts(
		searchQuery,
		sortQuery,
		page,
		size,
	);
  }

  @GetListAllProductsByBrandDocumentation()
  @HttpCode(200)
  @Get('/all/brandId/:brandId([0-9]+)')
  public async getListAllProductsByBrandId(
	@Param('brandId', ParseIntPipe) brandId: number,
	@Query() searchQuery: SearchQueryDto,
	@Query() sortQuery: SortQueryDto,
	@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
	@Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
  ): Promise<IProductsResponse> {
	return this.productService.getListAllProductsByBrandId(
		brandId,
		searchQuery,
		sortQuery,
		page,
		size,
	);
  }

  @GetListAllProductsByCategoryDocumentation()
  @HttpCode(200)
  @Get('/all/categoryId/:categoryId([0-9]+)')
  public async getListAllProductsByCategory(
	@Param('categoryId', ParseIntPipe) categoryId: number,
	@Query() searchQuery: SearchQueryDto,
	@Query() sortQuery: SortQueryDto,
	@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
	@Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
  ) {
	return this.productService.getListAllProductsByCategory(
		categoryId,
		searchQuery,
		sortQuery,
		page,
		size,
	);
  }

  @GetListAllProductsByBrandAndCategoryDocumentation()
  @HttpCode(200)
  @Get('/all/brandId/:brandId([0-9]+)/categoryId/:categoryId([0-9]+)')
  public async getAllByBrandAndCategory(
	@Param('brandId', ParseIntPipe) brandId: number,
	@Param('categoryId', ParseIntPipe) categoryId: number,
	@Query() searchQuery: SearchQueryDto,
	@Query() sortQuery: SortQueryDto,
	@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
	@Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
  ) {
	return this.productService.findAllByBrandIdAndCategoryId(
		brandId,
		categoryId,
		searchQuery,
		sortQuery,
		page,
		size,
	);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('/update/:id([0-9]+)')
  @UseInterceptors(FileInterceptor('image', imageMulterOptions))
  public async update(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateProductDto,
	@UploadedFile() image: Express.Multer.File,
  ): Promise<ProductModel> {
	return this.productService.updateProduct(id, dto, image);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/delete/:id([0-9]+)')
  public async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
	return this.productService.removeProduct(id);
  }
}
