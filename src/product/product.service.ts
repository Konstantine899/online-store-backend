import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductModel } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { FileService } from '../file/file.service';

@Injectable()
export class ProductService {
  constructor(
	@InjectModel(ProductModel) private productRepository: typeof ProductModel,
	private fileService: FileService,
  ) {}

  async productCreate(
	dto: CreateProductDto,
	image: Express.Multer.File,
  ): Promise<ProductModel> {
	const fileName = await this.fileService.createFile(image);
	return this.productRepository.create({ ...dto, image: fileName });
  }

  async findOneProduct(id: number): Promise<ProductModel> {
	const product = await this.productRepository.findByPk(id);
	if (!product) {
		throw new NotFoundException('Не найдено');
	}
	return product;
  }

  async findAllProducts(): Promise<ProductModel[]> {
	const products = await this.productRepository.findAll();
	if (!products) {
		throw new NotFoundException('Не найдено');
	}
	return products;
  }

  async removeProduct(id: number): Promise<boolean> {
	const findProduct = await this.productRepository.findByPk(id);
	if (!findProduct) {
		throw new NotFoundException('Не найдено');
	}
	const removedFile = await this.fileService.removeFile(findProduct.image);
	const removedProduct = await this.productRepository.destroy({
		where: { id },
	});
	if (!removedFile || !removedProduct) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return true;
  }

  async updateProduct(
	id: number,
	dto: CreateProductDto,
	image: Express.Multer.File,
  ): Promise<ProductModel> {
	const findProduct = await this.productRepository.findByPk(id);
	if (!findProduct) {
		throw new NotFoundException('Не найдено');
	}
	const updatedImage = await this.fileService.updateFile(
		findProduct.image,
		image,
	);
	return findProduct.update({
		...dto,
		name: dto.name,
		price: dto.price,
		image: updatedImage,
	});
  }
}
