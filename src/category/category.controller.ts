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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryModel } from './category-model';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/create')
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

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('/update/:id([0-9]+)')
  public async update(
	@Param('id', ParseIntPipe) id: number,
	@Body() dto: CreateCategoryDto,
  ): Promise<CategoryModel> {
	return this.categoryService.updateCategory(id, dto);
  }

  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/delete/:id([0-9]+)')
  public async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
	return this.categoryService.remove(id);
  }
}
