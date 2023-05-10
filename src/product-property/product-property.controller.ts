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
import { ApiTags } from '@nestjs/swagger';
import { CreateProductPropertyDocumentation } from './decorators/create-product-property.documentation';
import { GetProductPropertyDocumentation } from './decorators/get-product-property.documentation';
import { GetAllProductPropertiesDocumentation } from './decorators/get-all-product-properties.documentation';
import { UpdateProductPropertyDocumentation } from './decorators/update-product-property.documentation';

@ApiTags(`Свойства продукта`)
@Controller('product-property')
export class ProductPropertyController {
  constructor(
	private readonly productPropertyService: ProductPropertyService,
  ) {}

  @CreateProductPropertyDocumentation()
  @HttpCode(201)
  @Post('/product_id/:productId([0-9]+)/create')
  public async createProductProperty(
	@Param('productId', ParseIntPipe) productId: number,
	@Body() dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.createProductProperty(productId, dto);
  }

  @GetProductPropertyDocumentation()
  @HttpCode(200)
  @Get('/product_id/:productId([0-9]+)/get-property/:id([0-9]+)')
  public async getProductProperty(
	@Param('productId', ParseIntPipe) productId: number,
	@Param('id', ParseIntPipe) id: number,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.getProductProperty(productId, id);
  }

  @GetAllProductPropertiesDocumentation()
  @HttpCode(200)
  @Get('/product_id/:productId([0-9]+)/properties')
  public async getAllProductProperties(
	@Param('productId', ParseIntPipe) productId: number,
  ): Promise<ProductPropertyModel[]> {
	return this.productPropertyService.getAllProductProperties(productId);
  }

  @UpdateProductPropertyDocumentation()
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
