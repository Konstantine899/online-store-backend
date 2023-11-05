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
import { CreateProductPropertyDto } from '@app/infrastructure/dto';
import { ProductPropertyService } from '@app/infrastructure/services';
import { ApiTags } from '@nestjs/swagger';
import {
    CreateProductPropertySwaggerDecorator,
    GetProductPropertySwaggerDecorator,
    GetListProductPropertySwaggerDecorator,
    UpdateProductPropertySwaggerDecorator,
    RemoveProductPropertySwaggerDecorator,
    Roles,
} from '@app/infrastructure/common/decorators';

import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import {
    CreateProductPropertyResponse,
    GetListProductPropertyResponse,
    GetProductPropertyResponse,
    UpdateProductPropertyResponse,
    RemoveProductPropertyResponse,
} from '@app/infrastructure/responses';
import { IProductPropertyController } from '@app/domain/controllers';

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
