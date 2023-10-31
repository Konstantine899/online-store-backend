import {
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateProductPropertyDto } from '../../dto/product-property/create-product-property.dto';
import { ProductPropertyModel } from '../../../domain/models/product-property.model';
import { ProductPropertyRepository } from '../../repositories/product-property/product-property.repository';
import { ProductRepository } from '../../repositories/product/product.repository';
import { ProductModel } from '../../../domain/models/product.model';
import { CreateProductPropertyResponse } from '../../responses/product-property/create-product-property.response';
import { GetProductPropertyResponse } from '../../responses/product-property/get-product-property.response';
import { GetListProductPropertyResponse } from '../../responses/product-property/get-list-product-property.response';
import { UpdateProductPropertyResponse } from '../../responses/product-property/update-product-property.response';
import { RemoveProductPropertyResponse } from '../../responses/product-property/remove-product-property.response';

interface IProductPropertyService {
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
    ): Promise<ProductPropertyModel>;

    removeProductProperty(
        productId: number,
        id: number,
    ): Promise<RemoveProductPropertyResponse>;
}

@Injectable()
export class ProductPropertyService implements IProductPropertyService {
    constructor(
        private readonly propertyProductRepository: ProductPropertyRepository,
        private readonly productRepository: ProductRepository,
    ) {}

    public async createProductProperty(
        productId: number,
        dto: CreateProductPropertyDto,
    ): Promise<CreateProductPropertyResponse> {
        const product = await this.findProduct(productId);
        if (!product) {
            this.notFound('Продукт не найден');
        }
        return this.propertyProductRepository.create(product.id, dto);
    }

    public async getProductProperty(
        productId: number,
        id: number,
    ): Promise<GetProductPropertyResponse> {
        const product = await this.findProduct(productId);
        const property = await this.findProductProperty(productId, id);
        if (!product) {
            this.notFound('Продукт не найден');
        }
        if (!property) {
            this.notFound('Свойство продукта не найдено');
        }
        return property;
    }

    public async getListProductProperty(
        productId: number,
    ): Promise<GetListProductPropertyResponse[]> {
        await this.findProduct(productId);
        const properties = await this.findListProductProperty(productId);
        if (!properties.length) {
            this.notFound('Свойства продукта не найдены');
        }
        return properties;
    }

    public async updateProductProperty(
        productId: number,
        id: number,
        dto: CreateProductPropertyDto,
    ): Promise<ProductPropertyModel> {
        const product = await this.findProduct(productId);
        if (!product) {
            this.notFound('Продукт не найден');
        }
        const property = await this.getProductProperty(productId, id);
        if (!property) {
            this.notFound('Свойство продукта не найдено');
        }
        const updatedProductProperty = await this.updateProperty(property, dto);
        if (!updatedProductProperty) {
            this.conflict('При обновлении свойства продукта произошла ошибка');
        }
        return updatedProductProperty;
    }

    public async removeProductProperty(
        productId: number,
        id: number,
    ): Promise<RemoveProductPropertyResponse> {
        const product = await this.findProduct(productId);
        if (!product) {
            this.notFound('Продукт не найден');
        }
        const property = await this.getProductProperty(product.id, id);
        if (!property) {
            this.notFound('Свойство продукта не найдено');
        }
        return this.removeProperty(property.id);
    }

    private async findProduct(productId: number): Promise<ProductModel> {
        return this.productRepository.findProduct(productId);
    }

    private async findListProductProperty(
        productId: number,
    ): Promise<GetListProductPropertyResponse[]> {
        return this.propertyProductRepository.findListProductProperty(
            productId,
        );
    }

    private async findProductProperty(
        productId: number,
        id: number,
    ): Promise<GetProductPropertyResponse> {
        return this.propertyProductRepository.findOneProductProperty(
            productId,
            id,
        );
    }

    private async updateProperty(
        property: ProductPropertyModel,
        dto: CreateProductPropertyDto,
    ): Promise<UpdateProductPropertyResponse> {
        return this.propertyProductRepository.updateProductProperty(
            property,
            dto,
        );
    }

    private async removeProperty(
        id: number,
    ): Promise<RemoveProductPropertyResponse> {
        await this.propertyProductRepository.removeProductProperty(id);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }

    private conflict(message: string): void {
        throw new ConflictException({
            status: HttpStatus.CONFLICT,
            message,
        });
    }
}
