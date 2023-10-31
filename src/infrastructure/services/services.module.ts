import { Module } from '@nestjs/common';
import { UserModule } from '../../modules/user/user.module';
import { TokenModule } from '../../modules/token/token.module';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { BrandService } from './brand/brand.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { CartService } from './cart/cart.service';
import { ProductModule } from '../../modules/product/product.module';

@Module({
    imports: [
        RepositoriesModule,
        UserModule,
        TokenModule,
        JwtModule,
        ProductModule,
    ],
    providers: [AuthService, BrandService, CartService],
    exports: [AuthService, BrandService, CartService],
})
export class ServicesModule {}
