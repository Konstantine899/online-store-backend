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
import { CreateProductPropertyDocumentation } from './decorators/create-product-property.documentation';
import { GetProductPropertyDocumentation } from './decorators/get-product-property.documentation';
import { GetListProductPropertyDocumentation } from './decorators/get-list-product-property.documentation';
import { UpdateProductPropertyDocumentation } from './decorators/update-product-property.documentation';
import { RemoveProductPropertyDocumentation } from './decorators/remove-product-property.documentation';
import { Roles } from '../auth/decorators/roles-auth.decorator';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { CreateProductPropertyResponse } from './responses/create-product-property.response';
import { GetProductPropertyResponse } from './responses/get-product-property.response';
import { GetListProductPropertyResponse } from './responses/get-list-product-property.response';
import { UpdateProductPropertyResponse } from './decorators/update-product-property.response';
import { RemoveProductPropertyResponse } from './responses/remove-product-property.response';

@ApiTags('Свойства продукта')
@Controller('product-property')
export class ProductPropertyController {
    constructor(
        private readonly productPropertyService: ProductPropertyService,
    ) {}

    @CreateProductPropertyDocumentation()
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
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

    @GetProductPropertyDocumentation()
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @HttpCode(200)
    @Get('/product_id/:productId([0-9]+)/get-property/:id([0-9]+)')
    public async getProductProperty(
        @Param('productId', ParseIntPipe) productId: number,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetProductPropertyResponse> {
        return this.productPropertyService.getProductProperty(productId, id);
    }

    @GetListProductPropertyDocumentation()
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
    @HttpCode(200)
    @Get('/product_id/:productId([0-9]+)/properties')
    public async getListProductProperty(
        @Param('productId', ParseIntPipe) productId: number,
    ): Promise<GetListProductPropertyResponse[]> {
        return this.productPropertyService.getListProductProperty(productId);
    }

    @UpdateProductPropertyDocumentation()
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
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

    @RemoveProductPropertyDocumentation()
    @Roles('ADMIN')
    @UseGuards(JwtGuard, RoleGuard)
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
