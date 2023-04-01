import { InjectModel } from '@nestjs/sequelize';
import { ProductModel } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductPropertyModel } from '../product-property/product-property.model';
import { Op } from 'sequelize';

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

  public async findAllProducts(): Promise<ProductModel[]> {
	return this.productModel.findAll();
  }

  public async findAllByBrandId(brandId: number): Promise<ProductModel[]> {
	return this.productModel.findAll({
		where: { brandId },
	});
  }

  public async findAllByCategoryId(
	categoryId: number,
  ): Promise<ProductModel[]> {
	return this.productModel.findAll({ where: { categoryId } });
  }

  public async findAllByBrandIdAndCategoryId(
	brandId: number,
	categoryId: number,
  ): Promise<ProductModel[]> {
	return this.productModel.findAll({ where: { brandId, categoryId } });
  }

  public async search(search: string): Promise<ProductModel[]> {
	return this.productModel.findAll({
		where: { name: { [Op.like]: `%${search}%` } },
	});
  }

  public async sort(sort: string): Promise<ProductModel[]> {
	return this.productModel.findAll({
		order: [['price', sort.toUpperCase()]],
	});
  }

  public async searchAndSort(search, sort): Promise<ProductModel[]> {
	return this.productModel.findAll({
		where: { name: { [Op.like]: `%${search}%` } },
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
