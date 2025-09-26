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
import {
    CreateProductDto,
    SearchDto,
    SortingDto,
} from '@app/infrastructure/dto';
import { ProductService } from '@app/infrastructure/services';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    Roles,
    CreateProductSwaggerDecorator,
    GetProductSwaggerDecorator,
    GetListProductSwaggerDecorator,
    GetListProductByBrandIdSwaggerDecorator,
    GetListProductByCategoryIdSwaggerDecorator,
    GetAllByBrandIdAndCategoryIdSwaggerDecorator,
    UpdateProductSwaggerDecorator,
    RemoveProductSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { multerConfig } from '@app/infrastructure/config/multer';
import { ApiTags } from '@nestjs/swagger';
import {
    CreateProductResponse,
    GetProductResponse,
    GetListProductResponse,
    GetListProductByBrandIdResponse,
    GetListProductByCategoryIdResponse,
    GetAllByBrandIdAndCategoryIdResponse,
    UpdateProductResponse,
    RemoveProductResponse,
} from '@app/infrastructure/responses';

import { IProductController } from '@app/domain/controllers';

import { GetListProductV2Response } from '@app/infrastructure/responses/product/get-list-product-v2.response';
import { PaginatedResponse } from '@app/infrastructure/responses/paginated.response';
import { GetListProductV2SwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/product/get-list-product-v2-swagger-decorator';
import { GetListProductByBrandIdV2SwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/product/get-list-product-by-brand-id-v2-swagger-decorator';
import { ProductInfo } from '@app/infrastructure/paginate';
import { GetListProductByCategoryIdV2SwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/product/get-list-product-by-category-id-v2-swagger-decorator';
import { GetAllByBrandIdAndCategoryIdV2SwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/product/get-all-by-brand-id-and-category-id-v2-swagger-decorator';


@ApiTags('Продукт')
@Controller('product')
export class ProductController implements IProductController {
    constructor(private readonly productService: ProductService) {}

    @CreateProductSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    @UseInterceptors(FileInterceptor('image', multerConfig))
    public async create(
        @Body() dto: CreateProductDto,
        @UploadedFile()
        image: Express.Multer.File,
    ): Promise<CreateProductResponse> {
        return this.productService.productCreate(dto, image);
    }

    @GetProductSwaggerDecorator()
    @HttpCode(200)
    @Get('/one/:id')
    public async getProduct(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetProductResponse> {
        return this.productService.getProduct(id);
    }

    // ← НОВЫЙ: Endpoint для списка продуктов в новом формате
    @GetListProductV2SwaggerDecorator()
    @HttpCode(200)
    @Get('/list-v2')
    public async getListProductV2(
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetListProductV2Response> {
        return this.productService.getListProductV2(searchQuery, sortQuery, page, size);
    }

    // ← НОВЫЙ: Endpoint для списка продуктов по бренду в новом формате
    @GetListProductByBrandIdV2SwaggerDecorator()
    @HttpCode(200)
    @Get('/brand/:brandId/list-v2')
    public async getListProductByBrandIdV2(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<PaginatedResponse<ProductInfo>> {
        return this.productService.getListProductByBrandIdV2(brandId, searchQuery, sortQuery, page, size);
    }

    // ← НОВЫЙ: Endpoint для списка продуктов по категории в новом формате
    @GetListProductByCategoryIdV2SwaggerDecorator()
    @HttpCode(200)
    @Get('/category/:categoryId/list-v2')
    public async getListProductByCategoryIdV2(
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<PaginatedResponse<ProductInfo>> {
        return this.productService.getListProductByCategoryIdV2(categoryId, searchQuery, sortQuery, page, size);
    }

    // ← НОВЫЙ: Endpoint для списка продуктов по бренду и категории в новом формате
    @GetAllByBrandIdAndCategoryIdV2SwaggerDecorator()
    @HttpCode(200)
    @Get('/brand/:brandId/category/:categoryId/list-v2')
    public async getAllByBrandIdAndCategoryIdV2(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<PaginatedResponse<ProductInfo>> {
        return this.productService.getAllByBrandIdAndCategoryIdV2(brandId, categoryId, searchQuery, sortQuery, page, size);
    }

    @GetListProductSwaggerDecorator()
    @HttpCode(200)
    @Get('/all')
    public async getListProduct(
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ): Promise<GetListProductResponse> {
        return this.productService.getListProduct(
            searchQuery,
            sortQuery,
            page,
            limit,
        );
    }

    @GetListProductByBrandIdSwaggerDecorator()
    @HttpCode(200)
    @Get('/all/brandId/:brandId')
    public async getListProductByBrandId(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ): Promise<GetListProductByBrandIdResponse> {
        return this.productService.getListProductByBrandId(
            brandId,
            searchQuery,
            sortQuery,
            page,
            limit,
        );
    }

    @GetListProductByCategoryIdSwaggerDecorator()
    @HttpCode(200)
    @Get('/all/categoryId/:categoryId')
    public async getListProductByCategoryId(
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ): Promise<GetListProductByCategoryIdResponse> {
        return this.productService.getListProductByCategoryId(
            categoryId,
            searchQuery,
            sortQuery,
            page,
            limit,
        );
    }

    @GetAllByBrandIdAndCategoryIdSwaggerDecorator()
    @HttpCode(200)
    @Get('/all/brandId/:brandId/categoryId/:categoryId')
    public async getAllByBrandIdAndCategoryId(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ): Promise<GetAllByBrandIdAndCategoryIdResponse> {
        return this.productService.getAllByBrandIdAndCategoryId(
            brandId,
            categoryId,
            searchQuery,
            sortQuery,
            page,
            limit,
        );
    }

    @UpdateProductSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Put('/update/:id')
    @UseInterceptors(FileInterceptor('image', multerConfig))
    public async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateProductDto,
        @UploadedFile() image: Express.Multer.File,
    ): Promise<UpdateProductResponse> {
        return this.productService.updateProduct(id, dto, image);
    }

    @RemoveProductSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/delete/:id')
    public async removeProduct(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveProductResponse> {
        return this.productService.removeProduct(id);
    }
}
