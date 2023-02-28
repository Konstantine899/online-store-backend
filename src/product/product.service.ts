import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    return await this.productRepository.create({ ...dto, image: fileName });
  }

  async findOneProduct(id: string): Promise<ProductModel> {
    const product = await this.productRepository.findByPk(id);
    if (!product) {
      throw new HttpException(
        'По вашему запросу ничего не найдено',
        HttpStatus.NOT_FOUND,
      );
    }
    return product;
  }

  async findAllProducts(): Promise<ProductModel[]> {
    const products = await this.productRepository.findAll();
    if (!products) {
      throw new HttpException(
        'По вашему запросу ничего не найдено',
        HttpStatus.NOT_FOUND,
      );
    }
    return products;
  }

  async removeProduct(id: string): Promise<boolean> {
    const findProduct = await this.productRepository.findByPk(id);
    if (!findProduct) {
      throw new HttpException(
        'Удаляемый продукт не найден в Базе Данных',
        HttpStatus.NOT_FOUND,
      );
    }
    const removedFile = await this.fileService.removeFile(findProduct.image);
    const removedProduct = await this.productRepository.destroy({
      where: { id },
    });
    if (!removedFile || !removedProduct) {
      throw new HttpException(
        'При удалении продукта произошла ошибка',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return true;
  }

  async updateProduct(
    id: string,
    dto: CreateProductDto,
    image: Express.Multer.File,
  ) {
    const findProduct = await this.productRepository.findByPk(id);
    const updatedImage = await this.fileService.updateFile(
      findProduct.image,
      image,
    );
    return await findProduct.update({
      ...dto,
      name: dto.name,
      price: dto.price,
      image: updatedImage,
    });
  }
}
