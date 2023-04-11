import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OrderModel } from './order.model';

@Injectable()
export class OrderRepository {
  constructor(@InjectModel(OrderModel) private orderModel: typeof OrderModel) {}
  public async adminFindListAllOrders() {
	return this.orderModel.findAll();
  }
}
