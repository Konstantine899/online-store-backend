import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';
import {
    ExternalRoleProviderType,
    IProviderConfig,
    SyncMode,
} from '@app/domain/models';
import { IsSanitizedString } from '@app/infrastructure/common/validators';

/**
 * DTO для конфигурации провайдера (JSON)
 */
export class ProviderConfigDto implements IProviderConfig {
    @ApiPropertyOptional({
        example: 'ldap.company.com',
        description: 'LDAP/AD host',
    })
    @IsOptional()
    @IsString()
    declare host?: string;

    @ApiPropertyOptional({
        example: 389,
        description: 'LDAP/AD port',
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(65535)
    @Type(() => Number)
    declare port?: number;

    @ApiPropertyOptional({
        example: 'dc=company,dc=com',
        description: 'Base DN',
    })
    @IsOptional()
    @IsString()
    declare baseDN?: string;

    @ApiPropertyOptional({
        example: 'cn=admin,dc=company,dc=com',
        description: 'Bind DN',
    })
    @IsOptional()
    @IsString()
    declare bindDN?: string;

    @ApiPropertyOptional({
        example: 'password',
        description: 'Bind credentials (будет зашифровано)',
    })
    @IsOptional()
    @IsString()
    declare bindCredentials?: string;

    @ApiPropertyOptional({
        example: 'ou=users,dc=company,dc=com',
        description: 'Search base',
    })
    @IsOptional()
    @IsString()
    declare searchBase?: string;

    @ApiPropertyOptional({
        example: '(objectClass=user)',
        description: 'Search filter',
    })
    @IsOptional()
    @IsString()
    declare searchFilter?: string;

    // OAuth 2.0 / OIDC
    @ApiPropertyOptional({
        example: 'client-id-123',
        description: 'OAuth 2.0 Client ID',
    })
    @IsOptional()
    @IsString()
    declare clientId?: string;

    @ApiPropertyOptional({
        example: 'client-secret-456',
        description: 'OAuth 2.0 Client Secret (будет зашифровано)',
    })
    @IsOptional()
    @IsString()
    declare clientSecret?: string;

    @ApiPropertyOptional({
        example: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        description: 'Authorization URL',
    })
    @IsOptional()
    @IsString()
    declare authorizationURL?: string;

    @ApiPropertyOptional({
        example: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        description: 'Token URL',
    })
    @IsOptional()
    @IsString()
    declare tokenURL?: string;

    @ApiPropertyOptional({
        example: 'https://graph.microsoft.com/v1.0/me',
        description: 'UserInfo URL',
    })
    @IsOptional()
    @IsString()
    declare userInfoURL?: string;

    @ApiPropertyOptional({
        example: 'http://localhost:3000/auth/callback',
        description: 'Callback URL',
    })
    @IsOptional()
    @IsString()
    declare callbackURL?: string;

    @ApiPropertyOptional({
        example: ['openid', 'profile', 'email'],
        description: 'OAuth scopes',
        type: [String],
    })
    @IsOptional()
    declare scope?: string[];

    @ApiPropertyOptional({
        example: 'https://login.microsoftonline.com/common/v2.0',
        description: 'OIDC Issuer',
    })
    @IsOptional()
    @IsString()
    declare issuer?: string;

    // SAML
    @ApiPropertyOptional({
        example: 'https://sso.company.com/saml/sso',
        description: 'SAML Entry Point',
    })
    @IsOptional()
    @IsString()
    declare entryPoint?: string;

    @ApiPropertyOptional({
        example: '-----BEGIN CERTIFICATE-----...',
        description: 'SAML Certificate',
    })
    @IsOptional()
    @IsString()
    declare cert?: string;

    @ApiPropertyOptional({
        example: '-----BEGIN PRIVATE KEY-----...',
        description: 'SAML Private Key (будет зашифровано)',
    })
    @IsOptional()
    @IsString()
    declare privateKey?: string;

    // Общие
    @ApiPropertyOptional({
        example: true,
        description: 'Проверять ли SSL сертификат',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    declare verifySSL?: boolean;

    @ApiPropertyOptional({
        example: 30000,
        description: 'Таймаут запросов в миллисекундах',
        default: 30000,
    })
    @IsOptional()
    @IsInt()
    @Min(1000)
    @Max(300000)
    @Type(() => Number)
    declare timeout?: number;

    // Дополнительные поля
    [key: string]: unknown;
}

/**
 * DTO для создания конфигурации внешней системы
 */
export class CreateExternalRoleConfigDto {
    @ApiProperty({
        example: 'LDAP',
        description: 'Тип провайдера',
        enum: [
            'LDAP',
            'AD',
            'AZURE_AD',
            'GOOGLE_WORKSPACE',
            'OKTA',
            'SAML',
            'OIDC',
            'GENERIC_OAUTH2',
        ],
    })
    @IsNotEmpty({ message: 'Укажите тип провайдера' })
    @IsEnum(
        [
            'LDAP',
            'AD',
            'AZURE_AD',
            'GOOGLE_WORKSPACE',
            'OKTA',
            'SAML',
            'OIDC',
            'GENERIC_OAUTH2',
        ],
        { message: 'Неверный тип провайдера' },
    )
    declare providerType: ExternalRoleProviderType;

    @ApiProperty({
        example: 'Corporate LDAP',
        description: 'Название конфигурации',
    })
    @IsNotEmpty({ message: 'Укажите название конфигурации' })
    @IsString({ message: 'Название должно быть строкой' })
    @MinLength(1, {
        message: 'Название должно содержать минимум 1 символ',
    })
    @MaxLength(255, {
        message: 'Название не может быть длиннее 255 символов',
    })
    @IsSanitizedString({
        message: 'Название содержит недопустимые символы',
    })
    declare name: string;

    @ApiPropertyOptional({
        example: 'Интеграция с корпоративным LDAP сервером',
        description: 'Описание конфигурации',
    })
    @IsOptional()
    @IsString({ message: 'Описание должно быть строкой' })
    @MaxLength(1000, {
        message: 'Описание не может быть длиннее 1000 символов',
    })
    declare description?: string;

    @ApiProperty({
        example: {
            host: 'ldap.company.com',
            port: 389,
            baseDN: 'dc=company,dc=com',
        },
        description: 'Конфигурация провайдера',
        type: ProviderConfigDto,
    })
    @IsNotEmpty({ message: 'Укажите конфигурацию провайдера' })
    @IsObject({ message: 'Конфигурация должна быть объектом' })
    @ValidateNested()
    @Type(() => ProviderConfigDto)
    declare providerConfig: ProviderConfigDto;

    @ApiPropertyOptional({
        example: true,
        description: 'Включена ли автоматическая синхронизация',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'sync_enabled должен быть boolean' })
    @Type(() => Boolean)
    declare syncEnabled?: boolean;

    @ApiPropertyOptional({
        example: '0 */6 * * *',
        description: 'Cron выражение для автоматической синхронизации',
        default: '0 */6 * * *',
    })
    @IsOptional()
    @IsString({ message: 'Расписание должно быть строкой' })
    @MaxLength(50, {
        message: 'Расписание не может быть длиннее 50 символов',
    })
    declare syncSchedule?: string;

    @ApiPropertyOptional({
        example: 'INCREMENTAL',
        description: 'Режим синхронизации',
        enum: ['FULL', 'INCREMENTAL', 'ON_DEMAND'],
        default: 'INCREMENTAL',
    })
    @IsOptional()
    @IsEnum(['FULL', 'INCREMENTAL', 'ON_DEMAND'], {
        message: 'Неверный режим синхронизации',
    })
    declare syncMode?: SyncMode;

    @ApiPropertyOptional({
        example: true,
        description: 'Зашифрованы ли credentials',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'credentials_encrypted должен быть boolean' })
    @Type(() => Boolean)
    declare credentialsEncrypted?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Проверять ли SSL сертификат',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'verify_ssl должен быть boolean' })
    @Type(() => Boolean)
    declare verifySSL?: boolean;

    @ApiPropertyOptional({
        example: 30000,
        description: 'Таймаут запросов в миллисекундах',
        default: 30000,
        minimum: 1000,
        maximum: 300000,
    })
    @IsOptional()
    @IsInt({ message: 'Таймаут должен быть целым числом' })
    @Min(1000, { message: 'Таймаут не может быть меньше 1000 мс' })
    @Max(300000, { message: 'Таймаут не может быть больше 300000 мс' })
    @Type(() => Number)
    declare timeoutMs?: number;
}

/**
 * DTO для обновления конфигурации внешней системы
 */
export class UpdateExternalRoleConfigDto {
    @ApiPropertyOptional({
        example: 'Corporate LDAP Updated',
        description: 'Название конфигурации',
    })
    @IsOptional()
    @IsString({ message: 'Название должно быть строкой' })
    @MinLength(1, {
        message: 'Название должно содержать минимум 1 символ',
    })
    @MaxLength(255, {
        message: 'Название не может быть длиннее 255 символов',
    })
    @IsSanitizedString({
        message: 'Название содержит недопустимые символы',
    })
    declare name?: string;

    @ApiPropertyOptional({
        example: 'Обновленное описание',
        description: 'Описание конфигурации',
    })
    @IsOptional()
    @IsString({ message: 'Описание должно быть строкой' })
    @MaxLength(1000, {
        message: 'Описание не может быть длиннее 1000 символов',
    })
    declare description?: string;

    @ApiPropertyOptional({
        example: {
            host: 'ldap.company.com',
            port: 389,
        },
        description: 'Конфигурация провайдера',
        type: ProviderConfigDto,
    })
    @IsOptional()
    @IsObject({ message: 'Конфигурация должна быть объектом' })
    @ValidateNested()
    @Type(() => ProviderConfigDto)
    declare providerConfig?: ProviderConfigDto;

    @ApiPropertyOptional({
        example: true,
        description: 'Включена ли автоматическая синхронизация',
    })
    @IsOptional()
    @IsBoolean({ message: 'sync_enabled должен быть boolean' })
    @Type(() => Boolean)
    declare syncEnabled?: boolean;

    @ApiPropertyOptional({
        example: '0 */12 * * *',
        description: 'Cron выражение для автоматической синхронизации',
    })
    @IsOptional()
    @IsString({ message: 'Расписание должно быть строкой' })
    @MaxLength(50, {
        message: 'Расписание не может быть длиннее 50 символов',
    })
    declare syncSchedule?: string;

    @ApiPropertyOptional({
        example: 'FULL',
        description: 'Режим синхронизации',
        enum: ['FULL', 'INCREMENTAL', 'ON_DEMAND'],
    })
    @IsOptional()
    @IsEnum(['FULL', 'INCREMENTAL', 'ON_DEMAND'], {
        message: 'Неверный режим синхронизации',
    })
    declare syncMode?: SyncMode;

    @ApiPropertyOptional({
        example: true,
        description: 'Проверять ли SSL сертификат',
    })
    @IsOptional()
    @IsBoolean({ message: 'verify_ssl должен быть boolean' })
    @Type(() => Boolean)
    declare verifySSL?: boolean;

    @ApiPropertyOptional({
        example: 60000,
        description: 'Таймаут запросов в миллисекундах',
        minimum: 1000,
        maximum: 300000,
    })
    @IsOptional()
    @IsInt({ message: 'Таймаут должен быть целым числом' })
    @Min(1000, { message: 'Таймаут не может быть меньше 1000 мс' })
    @Max(300000, { message: 'Таймаут не может быть больше 300000 мс' })
    @Type(() => Number)
    declare timeoutMs?: number;
}

