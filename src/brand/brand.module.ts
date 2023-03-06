import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandModel } from './brand.model';

@Module({
  controllers: [BrandController],
  providers: [BrandService],
  imports: [SequelizeModule.forFeature([BrandModel])],
})
export class BrandModule {}
