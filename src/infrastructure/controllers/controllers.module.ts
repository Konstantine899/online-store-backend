import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { ServicesModule } from '../services/services.module';
import { JwtModule } from '@nestjs/jwt';
import { BrandController } from './brand/brand.controller';
import { CartController } from './cart/cart.controller';
import { CategoryController } from './category/category.controller';
import { ProductController } from './product/product.controller';
import { ProductPropertyController } from './product-property/product-property.controller';
import { OrderController } from './order/order.controller';
import { PaymentController } from './payment/payment.controller';
import { RatingController } from './rating/rating.controller';
import { RoleController } from './role/role.controller';
import { UserController } from './user/user.controller';

@Module({
    imports: [ServicesModule, ControllersModule, JwtModule],
    controllers: [
        AuthController,
        BrandController,
        CartController,
        CategoryController,
        ProductController,
        ProductPropertyController,
        OrderController,
        PaymentController,
        RatingController,
        RoleController,
        UserController,
    ],
})
export class ControllersModule {}
