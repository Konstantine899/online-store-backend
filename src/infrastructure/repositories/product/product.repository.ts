import { InjectModel } from '@nestjs/sequelize';
import { ProductModel, ProductPropertyModel } from '@app/domain/models';
import { CreateProductDto } from '../../dto/product/create-product.dto';
import { Op } from 'sequelize';
import { CreateProductResponse } from '../../responses/product/create-product.response';
import { GetProductResponse } from '../../responses/product/get-product.response';
import { Rows } from '../../paginate/rows';
import { UpdateProductResponse } from '../../responses/product/update-product.response';
import { IProductRepository } from '@app/domain/repositories';

export class ProductRepository implements IProductRepository {
    constructor(
        @InjectModel(ProductModel) private productModel: typeof ProductModel,
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
        return product.save();
    }

    // Используется в модуле Rating
    public async fidProductByPkId(productId: number): Promise<ProductModel> {
        return this.productModel.findByPk(productId);
    }

    public async findProduct(id: number): Promise<GetProductResponse> {
        return this.productModel.findOne({
            where: { id },
            include: [{ model: ProductPropertyModel }],
        });
    }

    public async findListProduct(
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: Rows[] }> {
        return this.productModel.findAndCountAll({
            where: search ? { name: { [Op.like]: `%${search}%` } } : null,
            order: sort ? [['price', sort.toUpperCase()]] : null,
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
    ): Promise<{ count: number; rows: Rows[] }> {
        return this.productModel.findAndCountAll({
            where: { brand_id: brandId },
            order: sort ? [['price', sort.toUpperCase()]] : null,
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
    ): Promise<{ count: number; rows: Rows[] }> {
        return this.productModel.findAndCountAll({
            where: { category_id: categoryId },
            order: sort ? [['price', sort.toUpperCase()]] : null,
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
    ): Promise<{ count: number; rows: Rows[] }> {
        return this.productModel.findAndCountAll({
            where: {
                brand_id: brandId,
                category_id: categoryId,
            },
            order: sort ? [['price', sort.toUpperCase()]] : null,
            limit: limit ? limit : 5,
            offset,
        });
    }

    public async removedProduct(id: number): Promise<number> {
        return this.productModel.destroy({ where: { id } });
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
