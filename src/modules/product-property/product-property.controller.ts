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
import { CreateProductPropertyDto } from './dto/create-product-property.dto';
import { ProductPropertyService } from './product-property.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateProductPropertySwaggerDecorator } from './decorators/create-product-property-swagger-decorator';
import { GetProductPropertySwaggerDecorator } from './decorators/get-product-property-swagger-decorator';
import { GetListProductPropertySwaggerDecorator } from './decorators/get-list-product-property-swagger-decorator';
import { UpdateProductPropertySwaggerDecorator } from './decorators/update-product-property-swagger-decorator';
import { RemoveProductPropertySwaggerDecorator } from './decorators/remove-product-property-swagger-decorator';
import { Roles } from '../../infrastructure/common/decorators/roles-auth.decorator';
import { RoleGuard } from '../role/role.guard';
import { CreateProductPropertyResponse } from './responses/create-product-property.response';
import { GetProductPropertyResponse } from './responses/get-product-property.response';
import { GetListProductPropertyResponse } from './responses/get-list-product-property.response';
import { UpdateProductPropertyResponse } from './responses/update-product-property.response';
import { RemoveProductPropertyResponse } from './responses/remove-product-property.response';
import { AuthGuard } from '../../infrastructure/common/guards/auth.guard';

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
