import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserFlagsDto {
    @ApiPropertyOptional({ description: 'Активен ли пользователь' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isActive должно быть булевым значением' })
    declare readonly isActive?: boolean;

    @ApiPropertyOptional({ description: 'Подписка на рассылку' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isNewsletterSubscribed должно быть булевым значением' })
    declare readonly isNewsletterSubscribed?: boolean;

    @ApiPropertyOptional({ description: 'Согласие на маркетинг' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isMarketingConsent должно быть булевым значением' })
    declare readonly isMarketingConsent?: boolean;

    @ApiPropertyOptional({ description: 'Согласие на cookies' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isCookieConsent должно быть булевым значением' })
    declare readonly isCookieConsent?: boolean;

    @ApiPropertyOptional({ description: 'Завершён ли профиль' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isProfileCompleted должно быть булевым значением' })
    declare readonly isProfileCompleted?: boolean;

    @ApiPropertyOptional({ description: 'VIP клиент' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isVipCustomer должно быть булевым значением' })
    declare readonly isVipCustomer?: boolean;

    @ApiPropertyOptional({ description: 'Бета-тестер' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isBetaTester должно быть булевым значением' })
    declare readonly isBetaTester?: boolean;

    @ApiPropertyOptional({ description: 'Заблокирован' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isBlocked должно быть булевым значением' })
    declare readonly isBlocked?: boolean;

    @ApiPropertyOptional({ description: 'Верифицирован' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isVerified должно быть булевым значением' })
    declare readonly isVerified?: boolean;

    @ApiPropertyOptional({ description: 'Премиум' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isPremium должно быть булевым значением' })
    declare readonly isPremium?: boolean;

    @ApiPropertyOptional({ description: 'Email верифицирован' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isEmailVerified должно быть булевым значением' })
    declare readonly isEmailVerified?: boolean;

    @ApiPropertyOptional({ description: 'Телефон верифицирован' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isPhoneVerified должно быть булевым значением' })
    declare readonly isPhoneVerified?: boolean;

    @ApiPropertyOptional({ description: 'Согласие с условиями' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isTermsAccepted должно быть булевым значением' })
    declare readonly isTermsAccepted?: boolean;

    @ApiPropertyOptional({ description: 'Согласие с политикой' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isPrivacyAccepted должно быть булевым значением' })
    declare readonly isPrivacyAccepted?: boolean;

    @ApiPropertyOptional({ description: 'Возраст подтверждён' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isAgeVerified должно быть булевым значением' })
    declare readonly isAgeVerified?: boolean;

    @ApiPropertyOptional({ description: '2FA включена' })
    @IsOptional()
    @IsBoolean({ message: 'Поле isTwoFactorEnabled должно быть булевым значением' })
    declare readonly isTwoFactorEnabled?: boolean;
}


