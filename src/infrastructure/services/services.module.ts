import {
    AuditLogModel,
    NotificationModel,
    NotificationTemplateModel,
    UserModel,
    UserNotificationSettingsModel,
    UserRoleModel,
} from '@app/domain/models';
import { NotificationEventHandler } from '@app/infrastructure/common/events/notification.event-handler';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { jwtConfig } from '@app/infrastructure/config/jwt';
import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AuditService } from './audit/audit.service';
import { RoleAuditService } from './audit/role-audit.service';
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
import { RoleCacheService } from './role/role-cache.service';
import { RoleService } from './role/role.service';
import { UserRolesCacheService } from './role/user-roles-cache.service';
import { TokenService } from './token/token.service';
import { UserAddressService } from './user-address/user-address.service';
import { UserCleanupService } from './user/user-cleanup.service';
import { UserService } from './user/user.service';

@Module({
    imports: [
        JwtModule.registerAsync(jwtConfig()),
        forwardRef(() => RepositoriesModule),
        SequelizeModule.forFeature([
            AuditLogModel,
            UserModel,
            UserRoleModel,
            NotificationModel,
            NotificationTemplateModel,
            UserNotificationSettingsModel,
        ]),
        JwtModule,
    ],
    providers: [
        MetricsCollector,
        AuditService,
        RoleAuditService,
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
        RoleCacheService,
        RoleService,
        UserRolesCacheService,
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
        AuditService,
        RoleAuditService,
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
        RoleCacheService,
        RoleService,
        UserRolesCacheService,
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
export class ServicesModule implements OnModuleInit {
    constructor(private readonly roleCacheService: RoleCacheService) {}

    /**
     * Инициализация модуля при старте приложения
     * Прогрев кэша для системных ролей
     */
    async onModuleInit(): Promise<void> {
        await this.roleCacheService.warmUp([
            'VIP_CUSTOMER',
            'WHOLESALE_CUSTOMER',
            'ADMIN',
            'MANAGER',
            'MODERATOR',
            'CUSTOMER',
            'TENANT_ADMIN',
            'TENANT_OWNER',
        ]);
    }
}
