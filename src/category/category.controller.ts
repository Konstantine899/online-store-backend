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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryModel } from './category-model';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Post('/create')
  @HttpCode(201)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryModel> {
	return this.categoryService.create(dto);
  }

  @Get('/all')
  @HttpCode(200)
  async getAll(): Promise<CategoryModel[]> {
	return this.categoryService.findAll();
  }

  @Get('/one/:id([0-9]+)')
  @HttpCode(200)
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryModel> {
	return this.categoryService.findOne(id);
  }

  @Put('/update/:id([0-9]+)')
  @HttpCode(200)
  async update(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateCategoryDto,
  ): Promise<CategoryModel> {
	return this.categoryService.update(id, dto);
  }

  @Delete('/delete/:id([0-9]+)')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
	return this.categoryService.remove(id);
  }
}
