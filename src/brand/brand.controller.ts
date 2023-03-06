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
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandModel } from './brand.model';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
  @Post('/create')
  @HttpCode(201)
  async create(@Body() dto: CreateBrandDto): Promise<BrandModel> {
	return this.brandService.create(dto);
  }
  @Get('/all')
  @HttpCode(200)
  async getAll(): Promise<BrandModel[]> {
	return this.brandService.findAll();
  }

  @Get('/one/:id([0-9]+)')
  @HttpCode(200)
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<BrandModel> {
	return this.brandService.findOne(id);
  }

  @Put('/update/:id([0-9]+)')
  @HttpCode(200)
  async update(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateBrandDto,
  ): Promise<BrandModel> {
	return this.brandService.update(id, dto);
  }
  @Delete('/delete/:id([0-9]+)')
  @HttpCode(200)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
	return this.brandService.remove(id);
  }
}
