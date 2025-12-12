import {
    ExternalRoleConfigModel,
    ExternalUserSyncLogModel,
    IErrorDetail,
    ISyncMetadata,
    RoleMappingModel,
    SyncMode,
    SyncTriggerType,
    SyncType,
} from '@app/domain/models';
import {
    IExternalRoleSyncRepository,
    IRoleMappingRepository,
    IUserRepository,
} from '@app/domain/repositories';
import { IRoleService } from '@app/domain/services';
import {
    IExternalRoleProvider,
    IExternalUser,
} from '@app/domain/services/role/i-external-role-provider';
import { TenantContext } from '@app/infrastructure/common/context';
import { CreateUserDto, UpdateUserDto } from '@app/infrastructure/dto';
import { Inject, Injectable, Logger } from '@nestjs/common';

/**
 * LDAPRoleSyncService
 *
 * Сервис для синхронизации пользователей и ролей из LDAP/AD в систему.
 * Отвечает за:
 * - Координацию синхронизации через провайдеры
 * - Создание/обновление пользователей в БД
 * - Применение role mappings
 * - Логирование синхронизаций
 * - Batch обработку для больших объемов
 */
@Injectable()
export class LDAPRoleSyncService {
    private readonly logger = new Logger(LDAPRoleSyncService.name);
    private readonly DEFAULT_BATCH_SIZE = 100;

    constructor(
        @Inject('IExternalRoleSyncRepository')
        private readonly externalRoleSyncRepository: IExternalRoleSyncRepository,
        @Inject('IRoleMappingRepository')
        private readonly roleMappingRepository: IRoleMappingRepository,
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        @Inject('IRoleService')
        private readonly roleService: IRoleService,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Синхронизировать пользователей из внешней системы
     * @param config - Конфигурация внешней системы
     * @param provider - Провайдер для работы с внешней системой
     * @param mode - Режим синхронизации (FULL, INCREMENTAL, ON_DEMAND)
     * @param triggerType - Тип триггера синхронизации
     * @param triggeredBy - ID пользователя, который запустил синхронизацию (null для scheduled)
     * @returns Лог синхронизации
     */
    public async syncUsers(
        config: ExternalRoleConfigModel,
        provider: IExternalRoleProvider,
        mode: SyncMode = 'INCREMENTAL',
        triggerType: SyncTriggerType = 'MANUAL',
        triggeredBy: number | null = null,
    ): Promise<ExternalUserSyncLogModel> {
        const startTime = new Date();
        const tenantId = config.tenantId;

        // Создаем лог синхронизации
        const syncLog = await this.externalRoleSyncRepository.createSyncLog({
            externalRoleConfigId: config.id,
            tenantId,
            syncType: mode as SyncType,
            triggerType,
            triggeredBy,
            status: 'RUNNING',
            startedAt: startTime,
        });

        const errorDetails: IErrorDetail[] = [];
        let totalUsers = 0;
        let createdUsers = 0;
        let updatedUsers = 0;
        let mappedUsers = 0;
        let skippedUsers = 0;
        let failedUsers = 0;

        try {
            // Получаем маппинги ролей для этой конфигурации
            const roleMappings = await this.roleMappingRepository.findMappings({
                externalRoleConfigId: config.id,
                tenantId,
                isActive: true,
            });

            // Определяем дату последней синхронизации для инкрементального режима
            const modifiedSince =
                mode === 'INCREMENTAL' && config.lastSyncAt
                    ? config.lastSyncAt
                    : undefined;

            // Получаем пользователей из внешней системы
            this.logger.log({
                configId: config.id,
                tenantId,
                mode,
                modifiedSince,
                message: 'Начало синхронизации пользователей из LDAP/AD',
            });

            const searchResult = await provider.searchUsers(
                config.providerConfig,
                {
                    modifiedSince,
                    limit: 1000, // Получаем порциями по 1000
                },
            );

            totalUsers = searchResult.totalCount;

            // Batch обработка пользователей
            const batchSize = this.DEFAULT_BATCH_SIZE;
            const batches = this.chunkArray(searchResult.users, batchSize);

            this.logger.debug({
                totalUsers,
                batches: batches.length,
                batchSize,
                message: 'Пользователи разбиты на батчи для обработки',
            });

            // Обрабатываем каждый батч
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];

                this.logger.debug({
                    batchNumber: i + 1,
                    totalBatches: batches.length,
                    batchSize: batch.length,
                    message: `Обработка батча ${i + 1}/${batches.length}`,
                });

                // Обрабатываем пользователей в батче параллельно (с ограничением)
                const batchResults = await Promise.allSettled(
                    batch.map((user) =>
                        this.syncUser(user, tenantId, roleMappings, config.id),
                    ),
                );

                // Подсчитываем результаты батча
                for (const result of batchResults) {
                    if (result.status === 'fulfilled') {
                        const syncResult = result.value;
                        if (syncResult.created) {
                            createdUsers++;
                        } else if (syncResult.updated) {
                            updatedUsers++;
                        } else if (syncResult.skipped) {
                            skippedUsers++;
                        }
                        if (syncResult.mapped) {
                            mappedUsers++;
                        }
                    } else {
                        failedUsers++;
                        errorDetails.push({
                            error:
                                result.reason instanceof Error
                                    ? result.reason.message
                                    : String(result.reason),
                            timestamp: new Date(),
                        });
                    }
                }

                // Обновляем прогресс в логе
                await this.updateSyncLogProgress(syncLog.id, {
                    totalUsers,
                    createdUsers,
                    updatedUsers,
                    mappedUsers,
                    skippedUsers,
                    failedUsers,
                });
            }

            // Обновляем статус конфигурации
            await this.externalRoleSyncRepository.updateConfig(config.id, {
                lastSyncAt: new Date(),
                status: 'ACTIVE',
                lastError: null,
                lastErrorAt: null,
                errorCount: 0,
            });

            const endTime = new Date();
            const durationMs = endTime.getTime() - startTime.getTime();

            // Завершаем лог синхронизации
            await this.externalRoleSyncRepository.updateSyncLog(syncLog.id, {
                status: failedUsers > 0 ? 'PARTIAL' : 'SUCCESS',
                totalUsers,
                createdUsers,
                updatedUsers,
                mappedUsers,
                skippedUsers,
                failedUsers,
                completedAt: endTime,
                durationMs,
                errorMessage:
                    errorDetails.length > 0
                        ? `Ошибки при синхронизации ${errorDetails.length} пользователей`
                        : null,
                errorDetails: errorDetails.length > 0 ? errorDetails : null,
                metadata: {
                    providerType: config.providerType,
                    syncStartTime: startTime,
                    syncEndTime: endTime,
                    totalExternalUsers: totalUsers,
                } as ISyncMetadata,
            });

            this.logger.log({
                configId: config.id,
                tenantId,
                totalUsers,
                createdUsers,
                updatedUsers,
                mappedUsers,
                skippedUsers,
                failedUsers,
                durationMs,
                message: 'Синхронизация пользователей завершена',
            });

            // Получаем обновленный лог
            const updatedLog =
                await this.externalRoleSyncRepository.updateSyncLog(
                    syncLog.id,
                    {},
                );

            if (!updatedLog) {
                throw new Error('Не удалось получить лог синхронизации');
            }

            return updatedLog;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            const endTime = new Date();
            const durationMs = endTime.getTime() - startTime.getTime();

            this.logger.error(
                {
                    error: errorMessage,
                    configId: config.id,
                    tenantId,
                    durationMs,
                },
                'Ошибка при синхронизации пользователей',
            );

            // Обновляем статус конфигурации
            await this.externalRoleSyncRepository.updateConfig(config.id, {
                status: 'ERROR',
                lastError: errorMessage,
                lastErrorAt: endTime,
                errorCount: (config.errorCount ?? 0) + 1,
            });

            // Завершаем лог с ошибкой
            await this.externalRoleSyncRepository.updateSyncLog(syncLog.id, {
                status: 'FAILED',
                totalUsers,
                createdUsers,
                updatedUsers,
                mappedUsers,
                skippedUsers,
                failedUsers,
                completedAt: endTime,
                durationMs,
                errorMessage,
                errorDetails: errorDetails.length > 0 ? errorDetails : null,
            });

            throw error;
        }
    }

    /**
     * Синхронизировать одного пользователя
     * @private
     */
    private async syncUser(
        externalUser: IExternalUser,
        tenantId: number,
        roleMappings: RoleMappingModel[],
        configId: number,
    ): Promise<{
        created: boolean;
        updated: boolean;
        skipped: boolean;
        mapped: boolean;
    }> {
        try {
            // Ищем существующего пользователя по email
            const existingUser = await this.userRepository.findUserByEmail(
                externalUser.email,
            );

            let created = false;
            let updated = false;

            if (!existingUser) {
                // Создаем нового пользователя
                // Генерируем временный пароль (пользователь должен будет его сменить)
                const tempPassword = this.generateTempPassword();

                const createUserDto: CreateUserDto = {
                    email: externalUser.email,
                    password: tempPassword,
                    firstName: externalUser.firstName,
                    lastName: externalUser.lastName,
                };

                await this.userRepository.createUser(createUserDto);

                // Обновляем телефон отдельно, если он есть (так как CreateUserDto не поддерживает phone)
                if (externalUser.phone) {
                    const userToUpdate =
                        await this.userRepository.findUserByEmail(
                            externalUser.email,
                        );
                    if (userToUpdate) {
                        await userToUpdate.update({
                            phone: externalUser.phone,
                        });
                    }
                }

                created = true;

                this.logger.debug({
                    email: this.maskEmail(externalUser.email),
                    externalId: externalUser.externalId,
                    message: 'Создан новый пользователь из LDAP/AD',
                });
            } else {
                // Обновляем существующего пользователя
                // Обновляем только если данные изменились
                const needsUpdate =
                    existingUser.firstName !== externalUser.firstName ||
                    existingUser.lastName !== externalUser.lastName ||
                    existingUser.phone !== externalUser.phone;

                if (needsUpdate) {
                    // Создаем объект UpdateUserDto напрямую
                    const updateData: UpdateUserDto = Object.assign(
                        {},
                        externalUser.firstName !== undefined && {
                            firstName: externalUser.firstName,
                        },
                        externalUser.lastName !== undefined && {
                            lastName: externalUser.lastName,
                        },
                    ) as UpdateUserDto;
                    await this.userRepository.updateUser(
                        existingUser,
                        updateData,
                    );

                    // Обновляем телефон отдельно, если он изменился
                    if (existingUser.phone !== externalUser.phone) {
                        await existingUser.update({
                            phone: externalUser.phone,
                        });
                    }

                    updated = true;

                    this.logger.debug({
                        userId: existingUser.id,
                        email: this.maskEmail(externalUser.email),
                        message: 'Обновлен пользователь из LDAP/AD',
                    });
                }
            }

            // Получаем финального пользователя (созданного или существующего)
            const finalUser =
                existingUser ??
                (await this.userRepository.findUserByEmail(externalUser.email));

            if (!finalUser) {
                throw new Error(
                    `Не удалось найти пользователя после синхронизации: ${externalUser.email}`,
                );
            }

            // Применяем маппинги ролей
            const mapped = await this.applyRoleMappings(
                finalUser.id,
                externalUser.externalRoles,
                roleMappings,
                tenantId,
            );

            return {
                created,
                updated,
                skipped: !created && !updated,
                mapped,
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    email: this.maskEmail(externalUser.email),
                    externalId: externalUser.externalId,
                    configId,
                    tenantId,
                },
                'Ошибка при синхронизации пользователя',
            );

            throw error;
        }
    }

    /**
     * Применить маппинги ролей к пользователю
     * @private
     */
    private async applyRoleMappings(
        userId: number | undefined,
        externalRoles: string[],
        roleMappings: RoleMappingModel[],
        tenantId: number,
    ): Promise<boolean> {
        if (
            !userId ||
            externalRoles.length === 0 ||
            roleMappings.length === 0
        ) {
            return false;
        }

        try {
            // Находим соответствующие маппинги для внешних ролей
            const applicableMappings = roleMappings.filter((mapping) =>
                externalRoles.includes(mapping.externalRoleName),
            );

            if (applicableMappings.length === 0) {
                return false;
            }

            // Сортируем по приоритету (меньше = выше приоритет)
            applicableMappings.sort(
                (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
            );

            // Применяем маппинги (можно применить несколько ролей)
            for (const mapping of applicableMappings) {
                try {
                    // Получаем текущие роли пользователя
                    const userRolesResponse =
                        await this.roleService.getUserRoles(userId, tenantId);
                    const userRoleIds = userRolesResponse.roles.map((r) =>
                        String(r.roleId),
                    );

                    // Проверяем, не назначена ли уже эта роль
                    if (!userRoleIds.includes(String(mapping.internalRoleId))) {
                        await this.roleService.assignRoleToUser(
                            {
                                userId,
                                roleId: mapping.internalRoleId,
                                tenantId,
                            },
                            tenantId,
                            userRolesResponse.roles.map((r) => r.roleName),
                        );

                        this.logger.debug({
                            userId,
                            externalRole: mapping.externalRoleName,
                            internalRoleId: mapping.internalRoleId,
                            message: 'Роль применена через маппинг',
                        });
                    }
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);

                    this.logger.warn({
                        error: errorMessage,
                        userId,
                        mappingId: mapping.id,
                        message: 'Ошибка при применении маппинга роли',
                    });
                    // Продолжаем применять другие маппинги
                }
            }

            return true;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error({
                error: errorMessage,
                userId,
                externalRoles,
                message: 'Ошибка при применении маппингов ролей',
            });

            return false;
        }
    }

    /**
     * Разбить массив на чанки для batch обработки
     * @private
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Обновить прогресс синхронизации в логе
     * @private
     */
    private async updateSyncLogProgress(
        syncLogId: number,
        progress: {
            totalUsers: number;
            createdUsers: number;
            updatedUsers: number;
            mappedUsers: number;
            skippedUsers: number;
            failedUsers: number;
        },
    ): Promise<void> {
        try {
            await this.externalRoleSyncRepository.updateSyncLog(syncLogId, {
                totalUsers: progress.totalUsers,
                createdUsers: progress.createdUsers,
                updatedUsers: progress.updatedUsers,
                mappedUsers: progress.mappedUsers,
                skippedUsers: progress.skippedUsers,
                failedUsers: progress.failedUsers,
            });
        } catch (error: unknown) {
            // Логируем, но не прерываем синхронизацию
            this.logger.warn(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    syncLogId,
                },
                'Ошибка при обновлении прогресса синхронизации',
            );
        }
    }

    /**
     * Сгенерировать временный пароль для нового пользователя
     * @private
     */
    private generateTempPassword(): string {
        // Генерируем случайный пароль длиной 16 символов
        const chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Маскировать email для логирования
     * @private
     */
    private maskEmail(email: string): string {
        const [localPart, domain] = email.split('@');
        if (!domain) {
            return email;
        }

        if (localPart.length <= 2) {
            return `${localPart[0]}***@${domain}`;
        }

        return `${localPart.substring(0, 2)}***@${domain}`;
    }
}
