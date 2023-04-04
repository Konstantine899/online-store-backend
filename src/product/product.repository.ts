import { InjectModel } from '@nestjs/sequelize';
import { ProductModel } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductPropertyModel } from '../product-property/product-property.model';
import { Op } from 'sequelize';
import { QueryProductDto } from './dto/query-product.dto';

export class ProductRepository {
  constructor(
	@InjectModel(ProductModel) private productModel: typeof ProductModel,
  ) {}

  public async create(
	dto: CreateProductDto,
	imageName: string,
  ): Promise<ProductModel> {
	const product = new ProductModel();
	product.name = dto.name;
	product.price = dto.price;
	product.brandId = dto.brandId;
	product.categoryId = dto.categoryId;
	product.image = imageName;
	return product.save();
  }

  public async findOneProduct(id: number): Promise<ProductModel> {
	return this.productModel.findOne({
		where: { id },
		include: [{ model: ProductPropertyModel }],
	});
  }

  public async findAllProducts(
	action: QueryProductDto,
	limit: number,
	offset: number,
  ): Promise<{ count: number; rows: ProductModel[] }> {
	const { sort, search } = action;
	return this.productModel.findAndCountAll({
		where: search ? { name: { [Op.like]: `%${search}%` } } : null,
		order: sort ? [['price', sort.toUpperCase()]] : null,
		limit: limit ? limit : 5,
		offset,
	});
  }

  public async findAllByBrandId(
	brandId: number,
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

  public async findAllByCategoryId(
	categoryId: number,
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
  ): Promise<ProductModel[]> {
	return this.productModel.findAll({
		where: { brandId, categoryId },
	});
  }

  public async findAllByBrandIdAndCategoryIdAndSort(
	brandId: number,
	categoryId: number,
	sort: string,
  ): Promise<ProductModel[]> {
	return this.productModel.findAll({
		where: { brandId, categoryId },
		order: [['price', sort.toUpperCase()]],
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
