import { InjectModel } from '@nestjs/sequelize';
import { ProductModel } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductPropertyModel } from '../product-property/product-property.model';
import { Op } from 'sequelize';
import { CreateProductResponse } from './responses/create-product.response';
import { GetProductResponse } from './responses/get-product.response';

export class ProductRepository {
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
	product.brandId = dto.brandId;
	product.categoryId = dto.categoryId;
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

  public async findListAllProducts(
	search: string,
	sort: string,
	limit: number,
	offset: number,
  ): Promise<{ count: number; rows: ProductModel[] }> {
	return this.productModel.findAndCountAll({
		where: search ? { name: { [Op.like]: `%${search}%` } } : null,
		order: sort ? [['price', sort.toUpperCase()]] : null,
		limit: limit ? limit : 5,
		offset,
	});
  }

  public async findListAllProductsByBrandId(
	brandId: number,
	search: string,
	sort: string,
	limit: number,
	offset: number,
  ): Promise<{ count: number; rows: ProductModel[] }> {
	return this.productModel.findAndCountAll({
		where: { brandId },
		order: sort ? [['price', sort.toUpperCase()]] : null,
		limit: limit ? limit : 5,
		offset,
	});
  }

  public async findListAllProductsByCategoryId(
	categoryId: number,
	search: string,
	sort: string,
	limit: number,
	offset: number,
  ): Promise<{ count: number; rows: ProductModel[] }> {
	return this.productModel.findAndCountAll({
		where: { categoryId },
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
  ): Promise<{ count: number; rows: ProductModel[] }> {
	return this.productModel.findAndCountAll({
		where: { brandId, categoryId },
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
  ): Promise<ProductModel> {
	return findProduct.update({
		...dto,
		name: dto.name,
		price: dto.price,
		brandId: dto.brandId,
		categoryId: dto.categoryId,
		image: updatedNameImage,
	});
  }
}
