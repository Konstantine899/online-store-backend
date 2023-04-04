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
  UseInterceptors,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductModel } from './product.model';
import { QueryProductDto } from './dto/query-product.dto';

export interface IProductsResponse {
  count: number;
  currentPage: number;
  nextPage: number;
  previousPage: number;
  lastPage: number;
  rows: ProductModel[];
}

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Post('/create')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('image'))
  public async create(
	@Body() dto: CreateProductDto,
	@UploadedFile() image: Express.Multer.File,
  ): Promise<ProductModel> {
	return this.productService.productCreate(dto, image);
  }

  @HttpCode(200)
  @Get('/one/:id([0-9]+)')
  public async getOne(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<ProductModel> {
	return this.productService.findOneProduct(id);
  }

  @HttpCode(200)
  @Get('/all')
  public async getAll(
	@Query() action: QueryProductDto,
	@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
	@Query('size', new DefaultValuePipe(1), ParseIntPipe) size: number,
  ): Promise<IProductsResponse> {
	return this.productService.findAllProducts(action, { page, size });
  }

  @HttpCode(200)
  @Get('/all/brandId/:brandId([0-9]+)')
  public async getAllByBrandId(
	@Param('brandId', ParseIntPipe) brandId: number,
	@Query() action: QueryProductDto,
	@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
	@Query('size', new DefaultValuePipe(1), ParseIntPipe) size: number,
  ): Promise<IProductsResponse> {
	return this.productService.findAllByBrandId(brandId, action, {
		page,
		size,
	});
  }
  @HttpCode(200)
  @Get('/all/categoryId/:categoryId([0-9]+)')
  public async getAllByCategory(
	@Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<ProductModel[]> {
	return this.productService.findAllByCategoryId(categoryId);
  }

  @HttpCode(200)
  @Get('/all/brandId/:brandId([0-9]+)/categoryId/:categoryId([0-9]+)')
  public async getAllByBrandAndCategory(
	@Param('brandId', ParseIntPipe) brandId: number,
	@Param('categoryId', ParseIntPipe) categoryId: number,
	@Query() { sort }: QueryProductDto,
  ): Promise<ProductModel[]> {
	return this.productService.findAllByBrandIdAndCategoryId(
		brandId,
		categoryId,
		sort,
	);
  }

  @Put('/update/:id([0-9]+)')
  @HttpCode(200) // Если создает новый ресурс то 201, Если обновляет имеющийся то 200
  @UseInterceptors(FileInterceptor('image'))
  public async update(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateProductDto,
	@UploadedFile() image: Express.Multer.File,
  ): Promise<ProductModel> {
	return this.productService.updateProduct(id, dto, image);
  }

  @HttpCode(200)
  @Delete('/delete/:id([0-9]+)')
  public async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
	return this.productService.removeProduct(id);
  }
}
