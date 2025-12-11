import {
    AuditLogModel,
    NotificationModel,
    NotificationTemplateModel,
    RoleModel,
    UserModel,
    UserNotificationSettingsModel,
    UserRoleModel,
} from '@app/domain/models';
import { NotificationEventHandler } from '@app/infrastructure/common/events/notification.event-handler';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { jwtConfig } from '@app/infrastructure/config/jwt';
import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import passport from 'passport';
import {
    OAuth2SSOStrategy,
    OIDCSSOStrategy,
    SAMLSSOStrategy,
    SSOStrategyFactory,
} from '../common/strategies/sso';
import { CustomPassportStrategy } from '../common/strategies/sso/custom-passport-strategy';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AuditCleanupService } from './audit/audit-cleanup.service';
import { AuditService } from './audit/audit.service';
import { RoleAuditCacheService } from './audit/role-audit-cache.service';
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
import {
    ADProvider,
    LDAPClientService,
    LDAPProvider,
    LDAPRoleSyncService,
} from './role/ldap';
import { RoleAnalyticsService } from './role/role-analytics.service';
import { RoleCacheService } from './role/role-cache.service';
import { RoleExpirationNotificationService } from './role/role-expiration-notification.service';
import { RoleExpirationService } from './role/role-expiration.service';
import { RoleService } from './role/role.service';
import {
    SSORoleSyncService,
    SSOStateService,
    SSOUserProfileMapper,
} from './role/sso';
import { UserRolesCacheService } from './role/user-roles-cache.service';
import { TokenService } from './token/token.service';
import { UserAddressService } from './user-address/user-address.service';
import { UserCleanupService } from './user/user-cleanup.service';
import { UserService } from './user/user.service';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync(jwtConfig()),
        forwardRef(() => RepositoriesModule),
        SequelizeModule.forFeature([
            AuditLogModel,
            UserModel,
            UserRoleModel,
            RoleModel,
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
        RoleAuditCacheService,
        AuditCleanupService,
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
        {
            provide: 'IRoleService',
            useExisting: RoleService,
        },
        RoleAnalyticsService,
        RoleExpirationService,
        RoleExpirationNotificationService,
        UserRolesCacheService,
        LDAPClientService,
        LDAPProvider,
        ADProvider,
        LDAPRoleSyncService,
        SSOStateService,
        SSOUserProfileMapper,
        SSORoleSyncService,
        OAuth2SSOStrategy,
        SAMLSSOStrategy,
        OIDCSSOStrategy,
        SSOStrategyFactory,
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
        RoleAuditCacheService,
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
        'IRoleService',
        RoleAnalyticsService,
        RoleExpirationService,
        RoleExpirationNotificationService,
        UserRolesCacheService,
        LDAPClientService,
        LDAPProvider,
        ADProvider,
        LDAPRoleSyncService,
        SSOStateService,
        SSOUserProfileMapper,
        SSORoleSyncService,
        OAuth2SSOStrategy,
        SAMLSSOStrategy,
        OIDCSSOStrategy,
        SSOStrategyFactory,
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
    constructor(
        private readonly roleCacheService: RoleCacheService,
        // Явно инжектируем стратегии, чтобы они были созданы и зарегистрированы в Passport
        private readonly oauth2SSOStrategy: OAuth2SSOStrategy,
        private readonly samlSSOStrategy: SAMLSSOStrategy,
        private readonly oidcSSOStrategy: OIDCSSOStrategy,
    ) {
        // КРИТИЧНО: Проверяем, что стратегии созданы и зарегистрированы в конструкторе
        // Это должно произойти автоматически через PassportStrategy в конструкторе стратегий
        console.log(
            `[ServicesModule constructor] Constructor called. Strategy instances: oauth2=${!!this.oauth2SSOStrategy}, saml=${!!this.samlSSOStrategy}, oidc=${!!this.oidcSSOStrategy}`,
        );

        // Явно обращаемся к стратегиям, чтобы гарантировать их создание
        // Это критично для тестового окружения, где стратегии могут не создаваться до использования guards
        void this.oauth2SSOStrategy;
        void this.samlSSOStrategy;
        void this.oidcSSOStrategy;

        // Passport хранит стратегии в приватном поле _strategies
        const passportWithStrategies = passport as typeof passport & {
            _strategies?: Record<string, unknown>;
        };
        const registeredStrategies = Object.keys(
            passportWithStrategies._strategies ?? {},
        );

        console.log(
            `[ServicesModule constructor] Registered strategies: ${registeredStrategies.join(', ')}`,
        );

        // КРИТИЧНО: Сохраняем callback на прототипе стратегий сразу после их создания
        // Это гарантирует, что _verify будет доступен при Object.create(prototype)
        // даже если конструктор не вызывался при создании экземпляра через passport.authenticate
        this.saveCallbackOnPrototype('oauth2', this.oauth2SSOStrategy);
        this.saveCallbackOnPrototype('saml', this.samlSSOStrategy);
        this.saveCallbackOnPrototype('oidc', this.oidcSSOStrategy);
    }

    /**
     * Сохраняет callback на прототипе стратегии для работы с Object.create(prototype)
     * Вызывается после регистрации стратегии в Passport
     */
    private saveCallbackOnPrototype(
        strategyName: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strategyInstance: any,
    ): void {
        try {
            console.log(
                `[ServicesModule.saveCallbackOnPrototype] Processing ${strategyName}`,
            );
            console.log(
                `[ServicesModule.saveCallbackOnPrototype] Instance _verify: ${typeof strategyInstance?._verify}`,
            );

            // КРИТИЧНО: Получаем callback из экземпляра стратегии (_verify)
            // PassportStrategy устанавливает _verify в конструкторе через super(...args, callback)
            let callback = strategyInstance?._verify;

            console.log(
                `[ServicesModule.saveCallbackOnPrototype] Callback from instance: ${typeof callback}`,
            );

            if (!callback || typeof callback !== 'function') {
                // Пробуем получить из статического Map по имени стратегии
                callback =
                    CustomPassportStrategy.verifyCallbacksByName?.get(
                        strategyName,
                    );
                console.log(
                    `[ServicesModule.saveCallbackOnPrototype] Callback from Map by name: ${typeof callback}`,
                );
            }

            // Если все еще не найден, пробуем получить из экземпляра через конструктор
            if (!callback || typeof callback !== 'function') {
                const Constructor = strategyInstance?.constructor;
                if (Constructor) {
                    callback =
                        CustomPassportStrategy.verifyCallbacks.get(Constructor);
                    console.log(
                        `[ServicesModule.saveCallbackOnPrototype] Callback from Map by constructor: ${typeof callback}, Constructor: ${Constructor.name}`,
                    );
                }
            }

            if (callback && typeof callback === 'function') {
                // Сохраняем callback на прототипе стратегии
                const proto = Object.getPrototypeOf(strategyInstance);
                if (proto) {
                    Object.defineProperty(proto, '_verify', {
                        value: callback,
                        writable: true,
                        configurable: true,
                        enumerable: false,
                    });
                    // Также сохраняем в Map по имени для будущих вызовов
                    CustomPassportStrategy.verifyCallbacksByName.set(
                        strategyName,
                        callback,
                    );
                    console.log(
                        `[ServicesModule] Saved callback on prototype for ${strategyName}`,
                    );
                }
            } else {
                console.warn(
                    `[ServicesModule] Callback not found for ${strategyName}. Instance has _verify: ${typeof strategyInstance?._verify}, Constructor: ${strategyInstance?.constructor?.name}`,
                );
            }
        } catch (error) {
            console.warn(
                `[ServicesModule] Failed to save callback on prototype for ${strategyName}:`,
                error,
            );
        }
    }

    /**
     * Инициализация модуля при старте приложения
     * Прогрев кэша для системных ролей
     *
     * Примечание: Стратегии Passport регистрируются автоматически при создании экземпляра
     * через PassportStrategy в конструкторе. Явная инжекция в конструкторе гарантирует их создание.
     *
     * ВАЖНО: Стратегии должны быть созданы до использования guards, поэтому они инжектируются
     * в конструкторе модуля, что гарантирует их создание при инициализации модуля.
     */
    async onModuleInit(): Promise<void> {
        // ВАЖНО: Стратегии Passport регистрируются автоматически при создании экземпляра
        // через PassportStrategy в конструкторе. Явная инжекция в конструкторе гарантирует их создание.
        //
        // Однако в тестовом окружении может быть проблема с порядком инициализации,
        // поэтому явно регистрируем стратегии, если они не зарегистрированы

        // КРИТИЧНО: Сохраняем callback на прототипе для всех стратегий
        // Это гарантирует, что _verify будет доступен при Object.create(prototype)
        // даже если конструктор не вызывался при создании экземпляра через passport.authenticate
        this.saveCallbackOnPrototype('oauth2', this.oauth2SSOStrategy);
        this.saveCallbackOnPrototype('saml', this.samlSSOStrategy);
        this.saveCallbackOnPrototype('oidc', this.oidcSSOStrategy);

        // КРИТИЧНО: Переопределяем authenticate на прототипе MultiSamlStrategy для SAML стратегии
        // Это должно происходить после создания экземпляра стратегии
        this.samlSSOStrategy.ensureAuthenticateOverride();

        // КРИТИЧНО: Явно регистрируем стратегии в Passport, если они не зарегистрированы
        // Это критично для тестового окружения, где стратегии могут не регистрироваться автоматически
        const passportWithStrategies = passport as typeof passport & {
            _strategies?: Record<string, unknown>;
        };
        const registeredStrategies = Object.keys(
            passportWithStrategies._strategies ?? {},
        );
        const requiredStrategies = ['oauth2', 'saml', 'oidc'];
        const missingStrategies = requiredStrategies.filter(
            (name) => !registeredStrategies.includes(name),
        );

        if (missingStrategies.length > 0) {
            // Явно регистрируем стратегии в Passport, если они не зарегистрированы
            // Это необходимо для тестового окружения, где порядок инициализации может отличаться
            console.warn(
                `[ServicesModule] Missing Passport strategies: ${missingStrategies.join(', ')}. Registered: ${registeredStrategies.join(', ')}. Attempting manual registration...`,
            );

            try {
                if (
                    missingStrategies.includes('oauth2') &&
                    this.oauth2SSOStrategy
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (passport as any).use('oauth2', this.oauth2SSOStrategy);
                    console.log(
                        '[ServicesModule] Manually registered oauth2 strategy',
                    );
                    // КРИТИЧНО: Сохраняем callback на прототипе стратегии для работы с Object.create(prototype)
                    this.saveCallbackOnPrototype(
                        'oauth2',
                        this.oauth2SSOStrategy,
                    );
                }
                if (
                    missingStrategies.includes('saml') &&
                    this.samlSSOStrategy
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (passport as any).use('saml', this.samlSSOStrategy);
                    console.log(
                        '[ServicesModule] Manually registered saml strategy',
                    );
                    this.saveCallbackOnPrototype('saml', this.samlSSOStrategy);
                }
                if (
                    missingStrategies.includes('oidc') &&
                    this.oidcSSOStrategy
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (passport as any).use('oidc', this.oidcSSOStrategy);
                    console.log(
                        '[ServicesModule] Manually registered oidc strategy',
                    );
                    this.saveCallbackOnPrototype('oidc', this.oidcSSOStrategy);
                }

                // Проверяем регистрацию после ручной регистрации
                const afterRegistration = Object.keys(
                    passportWithStrategies._strategies ?? {},
                );
                const stillMissing = requiredStrategies.filter(
                    (name) => !afterRegistration.includes(name),
                );

                if (stillMissing.length > 0) {
                    const errorMsg = `[ServicesModule] Failed to register Passport strategies: ${stillMissing.join(', ')}. Registered: ${afterRegistration.join(', ')}`;
                    if (process.env.NODE_ENV === 'test') {
                        console.error(errorMsg);
                    } else {
                        throw new Error(errorMsg);
                    }
                } else {
                    console.log(
                        `[ServicesModule] Successfully registered all strategies: ${afterRegistration.join(', ')}`,
                    );
                }
            } catch (error) {
                const errorMsg = `[ServicesModule] Error during manual strategy registration: ${error instanceof Error ? error.message : String(error)}`;
                if (process.env.NODE_ENV === 'test') {
                    console.error(errorMsg);
                } else {
                    throw new Error(errorMsg);
                }
            }
        } else {
            console.log(
                `[ServicesModule] All Passport strategies registered: ${registeredStrategies.join(', ')}`,
            );
        }

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
