import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { BrandService } from './brand/brand.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { CartService } from './cart/cart.service';
import { CategoryService } from './category/category.service';
import { FileService } from './file/file.service';
import { ProductService } from './product/product.service';
import { ProductPropertyService } from './product-property/product-property.service';
import { OrderService } from './order/order.service';
import { PaymentService } from './payment/payment.service';
import { RatingService } from './rating/rating.service';
import { RoleService } from './role/role.service';
import { jwtConfig } from '@app/infrastructure/config/jwt';
import { TokenService } from './token/token.service';
import { UserService } from './user/user.service';

@Module({
    imports: [
        JwtModule.registerAsync(jwtConfig()),
        RepositoriesModule,

        JwtModule,
    ],
    providers: [
        AuthService,
        BrandService,
        CartService,
        CategoryService,
        FileService,
        ProductService,
        ProductPropertyService,
        OrderService,
        PaymentService,
        RatingService,
        RoleService,
        TokenService,
        UserService,
    ],
    exports: [
        AuthService,
        BrandService,
        CartService,
        CategoryService,
        FileService,
        ProductService,
        ProductPropertyService,
        OrderService,
        PaymentService,
        RatingService,
        RoleService,
        TokenService,
        UserService,
    ],
})
export class ServicesModule {}
