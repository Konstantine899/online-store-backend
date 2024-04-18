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
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from '@app/infrastructure/services';
import { CreateCategoryDto } from '@app/infrastructure/dto';
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
import {
    CreateCategoryResponse,
    ListAllCategoriesResponse,
    CategoryResponse,
    UpdateCategoryResponse,
    RemoveCategoryResponse,
} from '@app/infrastructure/responses';
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
    @Delete('/delete/:id([0-9]+)')
    public async removeCategory(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveCategoryResponse> {
        return this.categoryService.removeCategory(id);
    }
}
