import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PerformanceMonitoringInterceptor } from '../common/interceptors/performance-monitoring.interceptor';
import { ServicesModule } from '../services/services.module';
import { AuthController } from './auth/auth.controller';
import { BrandController } from './brand/brand.controller';
import { CartController } from './cart/cart.controller';
import { CategoryController } from './category/category.controller';
import { LoginHistoryController } from './login-history/login-history.controller';
import { NotificationController } from './notification/notification.controller';
import { OrderController } from './order/order.controller';
import { PaymentController } from './payment/payment.controller';
import { ProductPropertyController } from './product-property/product-property.controller';
import { ProductController } from './product/product.controller';
import { RatingController } from './rating/rating.controller';
import { RoleController } from './role/role.controller';
import { UserAddressController } from './user-address/user-address.controller';
import { UserController } from './user/user.controller';

@Module({
    imports: [ServicesModule, JwtModule],
    providers: [PerformanceMonitoringInterceptor],
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
        UserController, // Более общий маршрут должен быть раньше
        UserAddressController, // Более специфичный маршрут должен быть позже
        LoginHistoryController,
        NotificationController,
    ],
})
export class ControllersModule {}
