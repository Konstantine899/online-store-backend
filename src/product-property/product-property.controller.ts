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
} from '@nestjs/common';
import { CreateProductPropertyDto } from './dto/create-product-property.dto';
import { ProductPropertyService } from './product-property.service';
import { ProductPropertyModel } from './product-property.model';

@Controller('product-property')
export class ProductPropertyController {
  constructor(
	private readonly productPropertyService: ProductPropertyService,
  ) {}
  @HttpCode(201)
  @Post('/product_id/:productId([0-9]+)/create')
  public async create(
	@Param('productId', ParseIntPipe) productId: number,
	@Body() dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.create(productId, dto);
  }

  @HttpCode(200)
  @Get('/product_id/:productId([0-9]+)/get_one_property/:id([0-9]+)')
  public async getOneProductProperty(
	@Param('productId', ParseIntPipe) productId: number,
	@Param('id', ParseIntPipe) id: number,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.findOneProductProperty(productId, id);
  }

  @HttpCode(200)
  @Get('/product_id/:productId([0-9]+)/all_properties')
  public async getAllProductProperties(
	@Param('productId', ParseIntPipe) productId: number,
  ): Promise<ProductPropertyModel[]> {
	return this.productPropertyService.findAllProductProperties(productId);
  }

  @HttpCode(200)
  @Put('/product_id/:productId([0-9]+)/update_property/:id([0-9]+)')
  public async updateProductProperty(
	@Param('productId', ParseIntPipe) productId: number,
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.updateProductProperty(
		productId,
		id,
		dto,
	);
  }

  @HttpCode(200)
  @Delete('/product_id/:productId([0-9]+)/delete_property/:id([0-9]+)')
  public async deleteProductProperty(
	@Param('productId', ParseIntPipe) productId: number,
	@Param('id', ParseIntPipe) id: number,
  ): Promise<boolean> {
	return this.productPropertyService.removeProductProperty(productId, id);
  }
}
