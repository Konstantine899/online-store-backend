import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandModel } from '../../domain/models/brand.model';
import { ProductModel } from '../../modules/product/product.model';
import { BrandRepository } from './brand/brand.repository';

@Module({
    imports: [SequelizeModule.forFeature([BrandModel, ProductModel])],
    providers: [BrandRepository],
    exports: [BrandRepository],
})
export class RepositoriesModule {}
