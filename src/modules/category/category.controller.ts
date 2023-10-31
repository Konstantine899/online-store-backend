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
import { Roles } from '../../infrastructure/common/decorators/roles-auth.decorator';
import { RoleGuard } from '../role/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategorySwaggerDecorator } from './decorators/create-category-swagger-decorator';
import { GetListAllCategoriesSwaggerDecorator } from './decorators/get-list-all-categories-swagger-decorator';
import { GetCategorySwaggerDecorator } from './decorators/get-category-swagger-decorator';
import { UpdateCategorySwaggerDecorator } from './decorators/update-category-swagger-decorator';
import { RemoveCategorySwaggerDecorator } from './decorators/remove-category-swagger-decorator';
import { CreateCategoryResponse } from './responses/create-category.response';
import { ListAllCategoriesResponse } from './responses/list-all-categories.response';
import { CategoryResponse } from './responses/category.response';
import { UpdateCategoryResponse } from './responses/update-category.response';
import { RemoveCategoryResponse } from './responses/remove-category.response';
import { AuthGuard } from '../../infrastructure/common/guards/auth.guard';

interface ICategoryController {
    createCategory(dto: CreateCategoryDto): Promise<CreateCategoryResponse>;

    getListAllCategories(): Promise<ListAllCategoriesResponse[]>;

    getCategory(id: number): Promise<CategoryResponse>;

    updateCategory(
        id: number,
        dto: CreateCategoryDto,
    ): Promise<UpdateCategoryResponse>;

    removeCategory(id: number): Promise<RemoveCategoryResponse>;
}

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
