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
  @Post('/:productId([0-9]+)/create')
  async create(
	@Param('productId', ParseIntPipe) productId: number,
	@Body() dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.create(productId, dto);
  }

  @HttpCode(200)
  @Get('/:productId([0-9]+)/one/:id([0-9]+)')
  async getOne(
	@Param('productId', ParseIntPipe) productId: number,
	@Param('id', ParseIntPipe) id: number,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.findOne(productId, id);
  }

  @HttpCode(200)
  @Get('/:productId([0-9]+)/all')
  async getAll(
	@Param('productId', ParseIntPipe) productId: number,
  ): Promise<ProductPropertyModel[]> {
	return this.productPropertyService.findAll(productId);
  }

  @HttpCode(200)
  @Put('/:productId([0-9]+)/update/:id([0-9]+)')
  async update(
	@Param('productId', ParseIntPipe) productId: number,
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	return this.productPropertyService.update(productId, id, dto);
  }

  @HttpCode(200)
  @Delete('/:productId([0-9]+)/delete/:id([0-9]+)')
  async delete(
	@Param('productId', ParseIntPipe) productId: number,
	@Param('id', ParseIntPipe) id: number,
  ): Promise<boolean> {
	return this.productPropertyService.remove(productId, id);
  }
}
