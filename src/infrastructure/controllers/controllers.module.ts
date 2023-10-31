import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { ServicesModule } from '../services/services.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../../modules/user/user.module';
import { BrandController } from './brand/brand.controller';
import { CartController } from './cart/cart.controller';
import { CategoryController } from './category/category.controller';
import { ProductController } from './product/product.controller';
import { ProductPropertyController } from './product-property/product-property.controller';

@Module({
    imports: [ServicesModule, ControllersModule, JwtModule, UserModule],
    controllers: [
        AuthController,
        BrandController,
        CartController,
        CategoryController,
        ProductController,
        ProductPropertyController,
    ],
})
export class ControllersModule {}
