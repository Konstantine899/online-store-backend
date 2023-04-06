import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RatingModel } from './rating.model';

@Module({ imports: [SequelizeModule.forFeature([RatingModel])] })
export class RatingModule {}
