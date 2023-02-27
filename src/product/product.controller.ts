import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { ProductModel } from './product.model';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @HttpCode(201)
  @Post('/create')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ProductModel> {
    return this.productService.productCreate(dto, image);
  }

  @HttpCode(200)
  @Get('/getone/:id([0-9]+)')
  getOne(@Param('id') id: string) {
    return this.productService.findOneProduct(id);
  }

  @HttpCode(200)
  @Get('/getall')
  getAll() {}

  @HttpCode(200) // Если создает новый ресурс то 201, Если обновляет имеющийся то 200
  @Put('/update/:id([0-9]+)')
  update() {}

  @HttpCode(200)
  @Delete('/delete/:id([0-9]+)')
  delete() {}
}
