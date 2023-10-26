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
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { imageMulterOptions } from '../file/image-multer.options';
import { CreateProductSwaggerDecorator } from './decorators/create-product-swagger-decorator';
import { ApiTags } from '@nestjs/swagger';
import { GetProductSwaggerDecorator } from './decorators/get-product-swagger-decorator';
import { SearchQueryDto } from './dto/search-query.dto';
import { SortQueryDto } from './dto/sort-query.dto';
import { GetListProductSwaggerDecorator } from './decorators/get-list-product-swagger-decorator';
import { GetListProductByBrandIdSwaggerDecorator } from './decorators/get-list-product-by-brand-id-swagger-decorator';
import { GetListProductByCategoryIdSwaggerDecorator } from './decorators/get-list-product-by-category-id-swagger-decorator';
import { GetAllByBrandIdAndCategoryIdSwaggerDecorator } from './decorators/get-all-by-brand-id-and-category-id-swagger-decorator';
import { UpdateProductSwaggerDecorator } from './decorators/update-product-swagger-decorator';
import { RemoveProductSwaggerDecorator } from './decorators/remove-product-swagger-decorator';
import { CreateProductResponse } from './responses/create-product.response';
import { GetProductResponse } from './responses/get-product.response';
import { GetListProductResponse } from './responses/get-list-product.response';
import { GetListProductByBrandIdResponse } from './responses/get-list-product-by-brand-id.response';
import { GetListProductByCategoryIdResponse } from './responses/get-list-product-by-category-id.response';
import { GetAllByBrandIdAndCategoryIdResponse } from './responses/get-all-by-brand-id-and-category-id.response';
import { UpdateProductResponse } from './responses/update-product.response';
import { RemoveProductResponse } from './responses/remove-product.response';

@ApiTags('Продукт')
@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}
    @CreateProductSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @Post('/create')
    @UseInterceptors(FileInterceptor('image', imageMulterOptions))
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
        @Query() searchQuery: SearchQueryDto,
        @Query() sortQuery: SortQueryDto,
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
        @Query() searchQuery: SearchQueryDto,
        @Query() sortQuery: SortQueryDto,
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
        @Query() searchQuery: SearchQueryDto,
        @Query() sortQuery: SortQueryDto,
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
        @Query() searchQuery: SearchQueryDto,
        @Query() sortQuery: SortQueryDto,
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
    @UseGuards(JwtGuard, RoleGuard)
    @Put('/update/:id([0-9]+)')
    @UseInterceptors(FileInterceptor('image', imageMulterOptions))
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
    @UseGuards(JwtGuard, RoleGuard)
    @Delete('/delete/:id([0-9]+)')
    public async removeProduct(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveProductResponse> {
        return this.productService.removeProduct(id);
    }
}
