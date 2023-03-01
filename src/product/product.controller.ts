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
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { ProductModel } from './product.model';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Post('/create')
  @HttpCode(201)
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ProductModel> {
    return this.productService.productCreate(dto, image);
  }

  @HttpCode(200)
  @Get('/getone/:id([0-9]+)')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<ProductModel> {
    return this.productService.findOneProduct(id);
  }

  @HttpCode(200)
  @Get('/getall')
  getAll(): Promise<ProductModel[]> {
    return this.productService.findAllProducts();
  }

  @HttpCode(200) // Если создает новый ресурс то 201, Если обновляет имеющийся то 200
  @Put('/update/:id([0-9]+)')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.productService.updateProduct(id, dto, image);
  }

  @HttpCode(200)
  @Delete('/delete/:id([0-9]+)')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.removeProduct(id);
  }
}
