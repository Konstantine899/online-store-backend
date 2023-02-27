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

  async findAllProducts() {}
}
