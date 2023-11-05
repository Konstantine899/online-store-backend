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
import { ProductService } from '../../services/product/product.service';
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
    @Get('/one/:id([0-9]+)')
    public async getProduct(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetProductResponse> {
        return this.productService.getProduct(id);
    }

    @GetListProductSwaggerDecorator()
    @HttpCode(200)
    @Get('/all')
    public async getListProduct(
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetListProductResponse> {
        return this.productService.getListProduct(
            searchQuery,
            sortQuery,
            page,
            size,
        );
    }

    @GetListProductByBrandIdSwaggerDecorator()
    @HttpCode(200)
    @Get('/all/brandId/:brandId([0-9]+)')
    public async getListProductByBrandId(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetListProductByBrandIdResponse> {
        return this.productService.getListProductByBrandId(
            brandId,
            searchQuery,
            sortQuery,
            page,
            size,
        );
    }

    @GetListProductByCategoryIdSwaggerDecorator()
    @HttpCode(200)
    @Get('/all/categoryId/:categoryId([0-9]+)')
    public async getListProductByCategoryId(
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetListProductByCategoryIdResponse> {
        return this.productService.getListProductByCategoryId(
            categoryId,
            searchQuery,
            sortQuery,
            page,
            size,
        );
    }

    @GetAllByBrandIdAndCategoryIdSwaggerDecorator()
    @HttpCode(200)
    @Get('/all/brandId/:brandId([0-9]+)/categoryId/:categoryId([0-9]+)')
    public async getAllByBrandIdAndCategoryId(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query() searchQuery: SearchDto,
        @Query() sortQuery: SortingDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(5), ParseIntPipe) size: number,
    ): Promise<GetAllByBrandIdAndCategoryIdResponse> {
        return this.productService.getAllByBrandIdAndCategoryId(
            brandId,
            categoryId,
            searchQuery,
            sortQuery,
            page,
            size,
        );
    }

    @UpdateProductSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Put('/update/:id([0-9]+)')
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
    @Delete('/delete/:id([0-9]+)')
    public async removeProduct(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveProductResponse> {
        return this.productService.removeProduct(id);
    }
}
