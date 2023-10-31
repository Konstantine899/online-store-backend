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
import { CreateProductPropertyDto } from '../../dto/product-property/create-product-property.dto';
import { ProductPropertyService } from '../../services/product-property/product-property.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateProductPropertySwaggerDecorator } from '../../common/decorators/swagger/product-property/create-product-property-swagger-decorator';
import { GetProductPropertySwaggerDecorator } from '../../common/decorators/swagger/product-property/get-product-property-swagger-decorator';
import { GetListProductPropertySwaggerDecorator } from '../../common/decorators/swagger/product-property/get-list-product-property-swagger-decorator';
import { UpdateProductPropertySwaggerDecorator } from '../../common/decorators/swagger/product-property/update-product-property-swagger-decorator';
import { RemoveProductPropertySwaggerDecorator } from '../../common/decorators/swagger/product-property/remove-product-property-swagger-decorator';
import { Roles } from '../../common/decorators/roles-auth.decorator';
import { RoleGuard } from '../../../modules/role/role.guard';
import { CreateProductPropertyResponse } from '../../responses/product-property/create-product-property.response';
import { GetProductPropertyResponse } from '../../responses/product-property/get-product-property.response';
import { GetListProductPropertyResponse } from '../../responses/product-property/get-list-product-property.response';
import { UpdateProductPropertyResponse } from '../../responses/product-property/update-product-property.response';
import { RemoveProductPropertyResponse } from '../../responses/product-property/remove-product-property.response';
import { AuthGuard } from '../../common/guards/auth.guard';

interface IProductPropertyController {
    createProductProperty(
        productId: number,
        dto: CreateProductPropertyDto,
    ): Promise<CreateProductPropertyResponse>;

    getProductProperty(
        productId: number,
        id: number,
    ): Promise<GetProductPropertyResponse>;

    getListProductProperty(
        productId: number,
    ): Promise<GetListProductPropertyResponse[]>;

    updateProductProperty(
        productId: number,
        id: number,
        dto: CreateProductPropertyDto,
    ): Promise<UpdateProductPropertyResponse>;

    removeProductProperty(
        productId: number,
        id: number,
    ): Promise<RemoveProductPropertyResponse>;
}

@ApiTags('Свойства продукта')
@Controller('product-property')
export class ProductPropertyController implements IProductPropertyController {
    constructor(
        private readonly productPropertyService: ProductPropertyService,
    ) {}

    @CreateProductPropertySwaggerDecorator()
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(201)
    @Post('/product_id/:productId([0-9]+)/create')
    public async createProductProperty(
        @Param('productId', ParseIntPipe) productId: number,
        @Body() dto: CreateProductPropertyDto,
    ): Promise<CreateProductPropertyResponse> {
        return this.productPropertyService.createProductProperty(
            productId,
            dto,
        );
    }

    @GetProductPropertySwaggerDecorator()
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    @Get('/product_id/:productId([0-9]+)/get-property/:id([0-9]+)')
    public async getProductProperty(
        @Param('productId', ParseIntPipe) productId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetProductPropertyResponse> {
        return this.productPropertyService.getProductProperty(productId, id);
    }

    @GetListProductPropertySwaggerDecorator()
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    @Get('/product_id/:productId([0-9]+)/properties')
    public async getListProductProperty(
        @Param('productId', ParseIntPipe) productId: number,
    ): Promise<GetListProductPropertyResponse[]> {
        return this.productPropertyService.getListProductProperty(productId);
    }

    @UpdateProductPropertySwaggerDecorator()
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    @Put('/product_id/:productId([0-9]+)/update_property/:id([0-9]+)')
    public async updateProductProperty(
        @Param('productId', ParseIntPipe) productId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateProductPropertyDto,
    ): Promise<UpdateProductPropertyResponse> {
        return this.productPropertyService.updateProductProperty(
            productId,
            id,
            dto,
        );
    }

    @RemoveProductPropertySwaggerDecorator()
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    @Delete(
        '/product_id/:productId([0-9]+)/remove-product-property/:id([0-9]+)',
    )
    public async removeProductProperty(
        @Param('productId', ParseIntPipe) productId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveProductPropertyResponse> {
        return this.productPropertyService.removeProductProperty(productId, id);
    }
}
