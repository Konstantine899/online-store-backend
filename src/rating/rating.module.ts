import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RatingModel } from './rating.model';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { RatingRepository } from './rating.repository';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
	SequelizeModule.forFeature([RatingModel]),
	ProductModule,
	UserModule,
  ],
  controllers: [RatingController],
  providers: [RatingService, RatingRepository],
})
export class RatingModule {}
