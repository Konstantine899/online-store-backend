import { Module } from '@nestjs/common';
import { UserModule } from '../../modules/user/user.module';
import { TokenModule } from '../../modules/token/token.module';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { BrandService } from './brand/brand.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { CartService } from './cart/cart.service';
import { ProductModule } from '../../modules/product/product.module';
import { CategoryService } from './category/category.service';

@Module({
    imports: [
        RepositoriesModule,
        UserModule,
        TokenModule,
        JwtModule,
        ProductModule,
    ],
    providers: [AuthService, BrandService, CartService, CategoryService],
    exports: [AuthService, BrandService, CartService, CategoryService],
})
export class ServicesModule {}
