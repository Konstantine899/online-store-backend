import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrderItemModel } from './order-item.model';
import { OrderItemRepository } from './order-item.repository';

@Module({
  imports: [SequelizeModule.forFeature([OrderItemModel])],
  providers: [OrderItemRepository],
  exports: [OrderItemRepository],
})
export class OrderItemModule {}
