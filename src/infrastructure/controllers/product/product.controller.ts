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
import { CreateProductDto } from '../../dto/product/create-product.dto';
import { ProductService } from '../../services/product/product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles-auth.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import { multerConfig } from '../../config/multer/multer.config';
import { CreateProductSwaggerDecorator } from '../../common/decorators/swagger/product/create-product-swagger-decorator';
import { ApiTags } from '@nestjs/swagger';
import { GetProductSwaggerDecorator } from '../../common/decorators/swagger/product/get-product-swagger-decorator';
import { SearchQueryDto } from '../../dto/product/search-query.dto';
import { SortQueryDto } from '../../dto/product/sort-query.dto';
import { GetListProductSwaggerDecorator } from '../../common/decorators/swagger/product/get-list-product-swagger-decorator';
import { GetListProductByBrandIdSwaggerDecorator } from '../../common/decorators/swagger/product/get-list-product-by-brand-id-swagger-decorator';
import { GetListProductByCategoryIdSwaggerDecorator } from '../../common/decorators/swagger/product/get-list-product-by-category-id-swagger-decorator';
import { GetAllByBrandIdAndCategoryIdSwaggerDecorator } from '../../common/decorators/swagger/product/get-all-by-brand-id-and-category-id-swagger-decorator';
import { UpdateProductSwaggerDecorator } from '../../common/decorators/swagger/product/update-product-swagger-decorator';
import { RemoveProductSwaggerDecorator } from '../../common/decorators/swagger/product/remove-product-swagger-decorator';
import { CreateProductResponse } from '../../responses/product/create-product.response';
import { GetProductResponse } from '../../responses/product/get-product.response';
import { GetListProductResponse } from '../../responses/product/get-list-product.response';
import { GetListProductByBrandIdResponse } from '../../responses/product/get-list-product-by-brand-id.response';
import { GetListProductByCategoryIdResponse } from '../../responses/product/get-list-product-by-category-id.response';
import { GetAllByBrandIdAndCategoryIdResponse } from '../../responses/product/get-all-by-brand-id-and-category-id.response';
import { UpdateProductResponse } from '../../responses/product/update-product.response';
import { RemoveProductResponse } from '../../responses/product/remove-product.response';
import { AuthGuard } from '../../common/guards/auth.guard';

interface IProductController {
    create(
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<CreateProductResponse>;

    getProduct(id: number): Promise<GetProductResponse>;

    getListProduct(
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetListProductResponse>;

    getListProductByBrandId(
        brandId: number,
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetListProductByBrandIdResponse>;

    getListProductByCategoryId(
        categoryId: number,
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetListProductByCategoryIdResponse>;

    getAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetAllByBrandIdAndCategoryIdResponse>;

    update(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse>;

    removeProduct(id: number): Promise<RemoveProductResponse>;
}

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
