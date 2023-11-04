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
import { CategoryService } from '../../services/category/category.service';
import { CreateCategoryDto } from '../../dto/category/create-category.dto';
import {
    Roles,
    CreateCategorySwaggerDecorator,
    GetListAllCategoriesSwaggerDecorator,
    GetCategorySwaggerDecorator,
    UpdateCategorySwaggerDecorator,
    RemoveCategorySwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategoryResponse } from '../../responses/category/create-category.response';
import { ListAllCategoriesResponse } from '../../responses/category/list-all-categories.response';
import { CategoryResponse } from '../../responses/category/category.response';
import { UpdateCategoryResponse } from '../../responses/category/update-category.response';
import { RemoveCategoryResponse } from '../../responses/category/remove-category.response';
import { ICategoryController } from '@app/domain/controllers';

@ApiTags('Категория')
@Controller('category')
export class CategoryController implements ICategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @CreateCategorySwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    public async createCategory(
        @Body() dto: CreateCategoryDto,
    ): Promise<CreateCategoryResponse> {
        return this.categoryService.createCategory(dto);
    }

    @GetListAllCategoriesSwaggerDecorator()
    @HttpCode(200)
    @Get('/categories')
    public async getListAllCategories(): Promise<ListAllCategoriesResponse[]> {
        return this.categoryService.getListAllCategories();
    }

    @GetCategorySwaggerDecorator()
    @HttpCode(200)
    @Get('/one/:id([0-9]+)')
    public async getCategory(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CategoryResponse> {
        return this.categoryService.getCategory(id);
    }

    @UpdateCategorySwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Put('/update/:id([0-9]+)')
    public async updateCategory(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateCategoryDto,
    ): Promise<UpdateCategoryResponse> {
        return this.categoryService.updateCategory(id, dto);
    }

    @RemoveCategorySwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/delete/:id([0-9]+)')
    public async removeCategory(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveCategoryResponse> {
        return this.categoryService.removeCategory(id);
    }
}
