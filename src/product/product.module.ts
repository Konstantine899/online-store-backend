import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductModel } from './product.model';
import { FileModule } from '../file/file.module';

@Module({
  providers: [ProductService],
  controllers: [ProductController],
  imports: [SequelizeModule.forFeature([ProductModel]), FileModule],
})
export class ProductModule {}
