import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ExternalRoleProviderType,
    ExternalRoleConfigStatus,
    SyncMode,
    IProviderConfig,
} from '@app/domain/models';

/**
 * Response для конфигурации внешней системы
 */
export class ExternalRoleConfigResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор конфигурации',
    })
    declare id: number;

    @ApiProperty({
        example: 1,
        description: 'ID тенанта',
    })
    declare tenantId: number;

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
    declare providerType: ExternalRoleProviderType;

    @ApiProperty({
        example: 'Corporate LDAP',
        description: 'Название конфигурации',
    })
    declare name: string;

    @ApiPropertyOptional({
        example: 'Интеграция с корпоративным LDAP сервером',
        description: 'Описание конфигурации',
    })
    declare description: string | null;

    @ApiProperty({
        example: { host: 'ldap.company.com', port: 389 },
        description: 'Конфигурация провайдера (без чувствительных данных)',
        type: 'object',
    })
    declare providerConfig: IProviderConfig;

    @ApiProperty({
        example: true,
        description: 'Включена ли автоматическая синхронизация',
    })
    declare syncEnabled: boolean;

    @ApiProperty({
        example: '0 */6 * * *',
        description: 'Cron выражение для автоматической синхронизации',
    })
    declare syncSchedule: string;

    @ApiProperty({
        example: 'INCREMENTAL',
        description: 'Режим синхронизации',
        enum: ['FULL', 'INCREMENTAL', 'ON_DEMAND'],
    })
    declare syncMode: SyncMode;

    @ApiPropertyOptional({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последней синхронизации',
    })
    declare lastSyncAt: Date | null;

    @ApiPropertyOptional({
        example: '2025-12-07T18:00:00Z',
        description: 'Время следующей синхронизации',
    })
    declare nextSyncAt: Date | null;

    @ApiProperty({
        example: true,
        description: 'Зашифрованы ли credentials',
    })
    declare credentialsEncrypted: boolean;

    @ApiProperty({
        example: true,
        description: 'Проверять ли SSL сертификат',
    })
    declare verifySSL: boolean;

    @ApiProperty({
        example: 30000,
        description: 'Таймаут запросов в миллисекундах',
    })
    declare timeoutMs: number;

    @ApiProperty({
        example: 'ACTIVE',
        description: 'Статус конфигурации',
        enum: ['ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING'],
    })
    declare status: ExternalRoleConfigStatus;

    @ApiPropertyOptional({
        example: 'Connection timeout',
        description: 'Последняя ошибка синхронизации',
    })
    declare lastError: string | null;

    @ApiPropertyOptional({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последней ошибки',
    })
    declare lastErrorAt: Date | null;

    @ApiProperty({
        example: 0,
        description: 'Количество ошибок',
    })
    declare errorCount: number;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID пользователя, создавшего конфигурацию',
    })
    declare createdBy: number | null;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID пользователя, обновившего конфигурацию',
    })
    declare updatedBy: number | null;

    @ApiProperty({
        example: '2025-12-07T10:00:00Z',
        description: 'Дата создания',
    })
    declare createdAt: Date;

    @ApiProperty({
        example: '2025-12-07T12:00:00Z',
        description: 'Дата последнего обновления',
    })
    declare updatedAt: Date;
}

