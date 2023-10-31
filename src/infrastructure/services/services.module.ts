import { Module } from '@nestjs/common';
import { UserModule } from '../../modules/user/user.module';
import { TokenModule } from '../../modules/token/token.module';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { BrandService } from './brand/brand.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { CartService } from './cart/cart.service';
// import { ProductModule } from '../../modules/product/product.module';
import { CategoryService } from './category/category.service';
import { FileService } from './file/file.service';
import { ProductService } from './product/product.service';
import { ProductPropertyService } from './product-property/product-property.service';
import { OrderService } from './order/order.service';
import { PaymentService } from './payment/payment.service';
import { RatingService } from './rating/rating.service';

@Module({
    imports: [
        RepositoriesModule,
        UserModule,
        TokenModule,
        JwtModule,
        UserModule,
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
        ServicesModule,
        UserModule,
        JwtModule,
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
    ],
})
export class ServicesModule {}
