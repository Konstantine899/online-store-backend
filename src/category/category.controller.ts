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
  public async create(@Body() dto: CreateCategoryDto): Promise<CategoryModel> {
	return this.categoryService.createCategory(dto);
  }

  @Get('/all')
  @HttpCode(200)
  public async getAll(): Promise<CategoryModel[]> {
	return this.categoryService.findAllCategories();
  }

  @Get('/one/:id([0-9]+)')
  @HttpCode(200)
  public async getOne(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryModel> {
	return this.categoryService.findOneCategory(id);
  }

  @Put('/update/:id([0-9]+)')
  @HttpCode(200)
  public async update(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateCategoryDto,
  ): Promise<CategoryModel> {
	return this.categoryService.updateCategory(id, dto);
  }

  @Delete('/delete/:id([0-9]+)')
  public async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
	return this.categoryService.remove(id);
  }
}
