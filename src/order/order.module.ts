import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrderModel } from './order.model';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { JwtModule } from '@nestjs/jwt';
import { OrderItemModule } from '../order-item/order-item.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
	SequelizeModule.forFeature([OrderModel]),
	JwtModule,
	OrderItemModule,
	CartModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
})
export class OrderModule {}
