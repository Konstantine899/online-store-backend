import { ProductModel, ProductPropertyModel } from '@app/domain/models';
import { IProductRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { CreateProductDto } from '@app/infrastructure/dto';
import { ProductInfo } from '@app/infrastructure/paginate';
import {
    CreateProductResponse,
    GetProductResponse,
    UpdateProductResponse,
} from '@app/infrastructure/responses';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

@Injectable()
export class ProductRepository implements IProductRepository {
    constructor(
        @InjectModel(ProductModel) private productModel: typeof ProductModel,
        private readonly tenantContext: TenantContext,
    ) {}

    public async create(
        dto: CreateProductDto,
        imageName: string,
    ): Promise<CreateProductResponse> {
        const product = new ProductModel();
        product.name = dto.name;
        product.price = dto.price;
        product.brand_id = dto.brandId;
        product.category_id = dto.categoryId;
        product.image = imageName;
        // Multi-tenant: автоматически устанавливаем tenant_id
        (product as any).tenant_id =
            this.tenantContext.getTenantIdOrNull() || 1;
        return product.save();
    }

    // Используется в модуле Rating
    public async fidProductByPkId(productId: number): Promise<ProductModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.productModel.findOne({
            where: {
                id: productId,
                tenant_id: tenantId,
            },
        }) as Promise<ProductModel>;
    }

    public async findProductProperty(id: number): Promise<GetProductResponse> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.productModel.findOne({
            where: {
                id,
                tenant_id: tenantId,
            },
            include: [{ model: ProductPropertyModel }],
        }) as Promise<GetProductResponse>;
    }

    public async findListProduct(
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const where: any = { tenant_id: tenantId };
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }
        return this.productModel.findAndCountAll({
            where,
            order: sort ? [['price', sort.toUpperCase()]] : undefined,
            limit: limit ? limit : 5,
            offset,
        });
    }

    public async findListProductByBrandId(
        brandId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.productModel.findAndCountAll({
            where: {
                brand_id: brandId,
                tenant_id: tenantId,
            },
            order: sort ? [['price', sort.toUpperCase()]] : undefined,
            limit: limit ? limit : 5,
            offset,
        });
    }

    public async findListProductByCategoryId(
        categoryId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.productModel.findAndCountAll({
            where: {
                category_id: categoryId,
                tenant_id: tenantId,
            },
            order: sort ? [['price', sort.toUpperCase()]] : undefined,
            limit: limit ? limit : 5,
            offset,
        });
    }

    public async findAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.productModel.findAndCountAll({
            where: {
                brand_id: brandId,
                category_id: categoryId,
                tenant_id: tenantId,
            },
            order: sort ? [['price', sort.toUpperCase()]] : undefined,
            limit: limit ? limit : 5,
            offset,
        });
    }

    public async removedProduct(id: number): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        return this.productModel.destroy({
            where: {
                id,
                tenant_id: tenantId,
            },
        });
    }

    public async updateProduct(
        dto: CreateProductDto,
        findProduct: ProductModel,
        updatedNameImage: string,
    ): Promise<UpdateProductResponse> {
        return findProduct.update({
            ...dto,
            name: dto.name,
            price: dto.price,
            brand_id: dto.brandId,
            category_id: dto.categoryId,
            image: updatedNameImage,
        });
    }
}
