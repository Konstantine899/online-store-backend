import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from '@app/infrastructure/services';
import { CreateCategoryDto, SearchDto, SortingDto } from '@app/infrastructure/dto';
import {
    Roles,
    CreateCategorySwaggerDecorator,
    GetListAllCategoriesSwaggerDecorator,
    GetCategorySwaggerDecorator,
    UpdateCategorySwaggerDecorator,
    RemoveCategorySwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { GetListCategoriesV2SwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/category/get-list-categories-v2-swagger-decorator';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { ApiTags } from '@nestjs/swagger';
import {
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    CategoryResponse,
    UpdateCategoryResponse,
    RemoveCategoryResponse,
} from '@app/infrastructure/responses';
import { GetListCategoriesV2Response } from '@app/infrastructure/responses/category/get-list-categories-v2.response';
import { ICategoryController } from '@app/domain/controllers';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '@app/infrastructure/config/multer';

@ApiTags('Категория')
@Controller('category')
export class CategoryController implements ICategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @CreateCategorySwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    @UseInterceptors(FileInterceptor('image', multerConfig))
    public async createCategory(
        @Body() dto: CreateCategoryDto,
        @UploadedFile() image: Express.Multer.File,
    ): Promise<CreateCategoryResponse> {
        return this.categoryService.createCategory(dto, image);
    }

    @GetListAllCategoriesSwaggerDecorator()
    @HttpCode(200)
    @Get('/categories')
    public async getListAllCategories(): Promise<ListAllCategoriesResponse[]> {
        return this.categoryService.getListAllCategories();
    }

    // SAAS-003: V2 endpoint with pagination
    @GetListCategoriesV2SwaggerDecorator()
    @HttpCode(200)
    @Get('/list-v2')
    public async getListCategoriesV2(
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetListCategoriesV2Response> {
        return this.categoryService.getListCategoriesV2(
            searchQuery,
            sortQuery,
            page,
            size,
        );
    }

    @GetCategorySwaggerDecorator()
    @HttpCode(200)
    @Get('/one/:id')
    public async getCategory(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CategoryResponse> {
        return this.categoryService.getCategory(id);
    }

    @UpdateCategorySwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Put('/update/:id')
    @UseInterceptors(FileInterceptor('image', multerConfig))
    public async updateCategory(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateCategoryDto,
        @UploadedFile() image: Express.Multer.File,
    ): Promise<UpdateCategoryResponse> {
        return this.categoryService.updateCategory(id, dto, image);
    }

    @RemoveCategorySwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/delete/:id')
    public async removeCategory(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveCategoryResponse> {
        return this.categoryService.removeCategory(id);
    }
}
