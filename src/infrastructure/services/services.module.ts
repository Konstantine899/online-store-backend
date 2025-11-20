import {
    NotificationModel,
    NotificationTemplateModel,
    UserModel,
    UserNotificationSettingsModel,
} from '@app/domain/models';
import { NotificationEventHandler } from '@app/infrastructure/common/events/notification.event-handler';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { jwtConfig } from '@app/infrastructure/config/jwt';
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AuthService } from './auth/auth.service';
import { BrandService } from './brand/brand.service';
import { CartService } from './cart/cart.service';
import { CategoryService } from './category/category.service';
import { FileService } from './file/file.service';
import { LoginHistoryService } from './login-history/login-history.service';
import { EmailProviderService } from './notification/email-provider.service';
import { NotificationService } from './notification/notification.service';
import { SmsProviderService } from './notification/sms-provider.service';
import { TemplateRendererService } from './notification/template-renderer.service';
import { OrderService } from './order/order.service';
import { PaymentService } from './payment/payment.service';
import { ProductPropertyService } from './product-property/product-property.service';
import { ProductService } from './product/product.service';
import { PromoCodeService } from './promo-code/promo-code.service';
import { RatingService } from './rating/rating.service';
import { RoleService } from './role/role.service';
import { TokenService } from './token/token.service';
import { UserAddressService } from './user-address/user-address.service';
import { UserCleanupService } from './user/user-cleanup.service';
import { UserService } from './user/user.service';

@Module({
    imports: [
        JwtModule.registerAsync(jwtConfig()),
        forwardRef(() => RepositoriesModule),
        SequelizeModule.forFeature([
            UserModel,
            NotificationModel,
            NotificationTemplateModel,
            UserNotificationSettingsModel,
        ]),
        JwtModule,
    ],
    providers: [
        MetricsCollector,
        AuthService,
        BrandService,
        CartService,
        CategoryService,
        FileService,
        ProductService,
        ProductPropertyService,
        OrderService,
        PaymentService,
        PromoCodeService,
        RatingService,
        RoleService,
        TokenService,
        UserService,
        UserAddressService,
        UserCleanupService,
        LoginHistoryService,
        NotificationService,
        NotificationEventHandler,
        {
            provide: 'IEmailProvider',
            useClass: EmailProviderService,
        },
        {
            provide: 'ISmsProvider',
            useClass: SmsProviderService,
        },
        {
            provide: 'ITemplateRenderer',
            useClass: TemplateRendererService,
        },
    ],
    exports: [
        MetricsCollector,
        AuthService,
        BrandService,
        CartService,
        CategoryService,
        FileService,
        ProductService,
        ProductPropertyService,
        OrderService,
        PaymentService,
        PromoCodeService,
        RatingService,
        RoleService,
        TokenService,
        UserService,
        UserAddressService,
        UserCleanupService,
        LoginHistoryService,
        NotificationService,
        'IEmailProvider',
        'ISmsProvider',
        'ITemplateRenderer',
    ],
})
export class ServicesModule {}
