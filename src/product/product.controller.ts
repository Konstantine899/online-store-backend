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
  UploadedFile,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductModel } from './product.model';
import { SequelizeUniqueConstraintException } from '../exceptions/sequelize-unique-constraint.exception';

@Controller('product')
@UseFilters(SequelizeUniqueConstraintException)
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Post('/create')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ProductModel> {
    return this.productService.productCreate(dto, image);
  }

  @HttpCode(200)
  @Get('/getone/:id([0-9]+)')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<ProductModel> {
    return this.productService.findOneProduct(id);
  }

  @HttpCode(200)
  @Get('/getall')
  async getAll(): Promise<ProductModel[]> {
    return this.productService.findAllProducts();
  }

  @Put('/update/:id([0-9]+)')
  @HttpCode(200) // Если создает новый ресурс то 201, Если обновляет имеющийся то 200
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ProductModel> {
    return this.productService.updateProduct(id, dto, image);
  }

  @HttpCode(200)
  @Delete('/delete/:id([0-9]+)')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.productService.removeProduct(id);
  }
}
