import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrderItemModel } from './order-item.model';

@Module({
  imports: [SequelizeModule.forFeature([OrderItemModel])],
})
export class OrderItemModule {}
