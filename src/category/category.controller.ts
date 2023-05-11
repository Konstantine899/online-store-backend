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
import { ApiTags } from '@nestjs/swagger';
import { CreateCategoryDocumentation } from './decorators/create-category.documentation';
import { GetListAllCategoriesDocumentation } from './decorators/get-list-all-categories.documentation';
import { GetCategoryDocumentation } from './decorators/get-category.documentation';
import { UpdateCategoryDocumentation } from './decorators/update-category.documentation';

@ApiTags(`Категория`)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @CreateCategoryDocumentation()
  @HttpCode(201)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('/create')
  public async createCategory(
	@Body() dto: CreateCategoryDto,
  ): Promise<CategoryModel> {
	return this.categoryService.createCategory(dto);
  }

  @GetListAllCategoriesDocumentation()
  @Get('/categories')
  @HttpCode(200)
  public async getListAllCategories(): Promise<CategoryModel[]> {
	return this.categoryService.getListAllCategories();
  }

  @GetCategoryDocumentation()
  @Get('/one/:id([0-9]+)')
  @HttpCode(200)
  public async getCategory(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryModel> {
	return this.categoryService.getCategory(id);
  }

  @UpdateCategoryDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('/update/:id([0-9]+)')
  public async updateCategory(
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
