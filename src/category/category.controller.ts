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
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategoryDocumentation } from './decorators/create-category.documentation';
import { GetListAllCategoriesDocumentation } from './decorators/get-list-all-categories.documentation';
import { GetCategoryDocumentation } from './decorators/get-category.documentation';
import { UpdateCategoryDocumentation } from './decorators/update-category.documentation';
import { RemoveCategoryDocumentation } from './decorators/remove-category.documentation';
import { CreateCategoryResponse } from './responses/create-category.response';
import { ListAllCategoriesResponse } from './responses/list-all-categories.response';
import { CategoryResponse } from './responses/category.response';
import { UpdateCategoryResponse } from './responses/update-category.response';

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
  ): Promise<CreateCategoryResponse> {
	return this.categoryService.createCategory(dto);
  }

  @GetListAllCategoriesDocumentation()
  @Get('/categories')
  @HttpCode(200)
  public async getListAllCategories(): Promise<ListAllCategoriesResponse[]> {
	return this.categoryService.getListAllCategories();
  }

  @GetCategoryDocumentation()
  @Get('/one/:id([0-9]+)')
  @HttpCode(200)
  public async getCategory(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryResponse> {
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
  ): Promise<UpdateCategoryResponse> {
	return this.categoryService.updateCategory(id, dto);
  }

  @RemoveCategoryDocumentation()
  @HttpCode(200)
  @Roles('ADMIN')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/delete/:id([0-9]+)')
  public async removeCategory(
	@Param('id', ParseIntPipe) id: number,
  ): Promise<number> {
	return this.categoryService.removeCategory(id);
  }
}
