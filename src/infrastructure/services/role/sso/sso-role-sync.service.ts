import { ISSOUserProfile } from '@app/domain/types/sso/sso-user-profile.types';
import { ExternalRoleConfigModel } from '@app/domain/models/external-role-config.model';
import { RoleMappingModel } from '@app/domain/models/role-mapping.model';
import { UserModel } from '@app/domain/models';
import { Injectable } from '@nestjs/common';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { UserService } from '@app/infrastructure/services/user/user.service';
import { RoleService } from '@app/infrastructure/services/role/role.service';
import { RoleMappingRepository } from '@app/infrastructure/repositories/role/role-mapping.repository';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * SSORoleSyncService - Just-in-time provisioning и синхронизация ролей для SSO
 *
 * Функциональность:
 * - Проверка существования пользователя по email
 * - Создание пользователя при первом SSO входе (just-in-time provisioning)
 * - Синхронизация ролей из SSO профиля через RoleMapping
 * - Обновление данных пользователя при каждом входе
 */
@Injectable()
export class SSORoleSyncService {
    private readonly logger = createLogger('SSORoleSyncService');
    private readonly BCRYPT_ROUNDS = 10;

    constructor(
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly roleMappingRepository: RoleMappingRepository,
    ) {}

    /**
     * Provision пользователя из SSO профиля (just-in-time)
     * @param profile - профиль пользователя из SSO
     * @param providerConfig - конфигурация провайдера
     * @param tenantId - ID тенанта
     * @returns Пользователь (существующий или созданный)
     */
    public async provisionUser(
        profile: ISSOUserProfile,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _providerConfig: ExternalRoleConfigModel,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _tenantId: number,
    ): Promise<UserModel> {
        // Проверяем существование пользователя
        let user: UserModel | null = null;
        try {
            user = await this.userService.findUserByEmail(profile.email);
        } catch {
            // Пользователь не найден - это нормально для just-in-time provisioning
            this.logger.debug(
                { email: profile.email },
                'User not found, will create',
            );
        }

        if (user) {
            // Пользователь существует - обновляем данные
            this.logger.debug(
                { userId: user.id, email: profile.email },
                'User exists, updating profile',
            );
            return await this.updateUserProfile(user, profile);
        }

        // Пользователь не существует - создаем (just-in-time provisioning)
        this.logger.info(
            { email: profile.email, providerType: profile.providerType },
            'Creating new user via SSO (just-in-time provisioning)',
        );

        return await this.createSSOUser(profile);
    }

    /**
     * Синхронизация ролей из SSO профиля
     * @param userId - ID пользователя
     * @param profile - профиль пользователя из SSO
     * @param providerConfig - конфигурация провайдера
     * @param tenantId - ID тенанта
     */
    public async syncRoles(
        userId: number,
        profile: ISSOUserProfile,
        providerConfig: ExternalRoleConfigModel,
        tenantId: number,
    ): Promise<void> {
        const externalRoles = profile.roles ?? [];

        if (externalRoles.length === 0) {
            this.logger.debug(
                { userId },
                'No external roles to sync',
            );
            return;
        }

        // Получаем маппинги для этого провайдера
        const roleMappings = await this.roleMappingRepository.findMappingsByConfig(
            providerConfig.id,
            tenantId,
        );

        if (roleMappings.length === 0) {
            this.logger.debug(
                { userId, providerId: providerConfig.id },
                'No role mappings configured for provider',
            );
            return;
        }

        // Применяем маппинги ролей
        await this.applyRoleMappings(
            userId,
            externalRoles,
            roleMappings,
            tenantId,
        );
    }

    /**
     * Создание SSO пользователя
     * @private
     */
    private async createSSOUser(profile: ISSOUserProfile): Promise<UserModel> {
        // Генерируем случайный пароль (никогда не будет использован для входа)
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(
            randomPassword,
            this.BCRYPT_ROUNDS,
        );

        // Создаем пользователя через UserService
        // Используем временный DTO с минимальными данными
        const createUserDto = {
            email: profile.email,
            password: randomPassword, // Временный пароль
            firstName: profile.firstName,
            lastName: profile.lastName,
        };

        try {
            const createResponse = await this.userService.createUser(
                createUserDto as Parameters<
                    typeof this.userService.createUser
                >[0],
            );

            // Получаем полную модель пользователя
            const user = await this.userService.findAuthenticatedUser(
                createResponse.id,
            );

            // Обновляем пароль на случайный (чтобы вход через пароль был невозможен)
            // Это делается через прямой доступ к модели, так как UserService не имеет метода для этого
            await user.update({ password: hashedPassword });

            // Помечаем пользователя как SSO (можно добавить флаг is_sso_user в будущем)
            this.logger.info(
                {
                    userId: user.id,
                    email: profile.email,
                    providerType: profile.providerType,
                },
                'SSO user created successfully',
            );

            return user;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    email: profile.email,
                },
                'Failed to create SSO user',
            );

            throw error;
        }
    }

    /**
     * Обновление профиля существующего пользователя
     * @private
     */
    private async updateUserProfile(
        user: UserModel,
        profile: ISSOUserProfile,
    ): Promise<UserModel> {
        const updates: Partial<UserModel> = {};

        // Обновляем имя и фамилию если они изменились
        if (profile.firstName && profile.firstName !== user.firstName) {
            updates.firstName = profile.firstName;
        }
        if (profile.lastName && profile.lastName !== user.lastName) {
            updates.lastName = profile.lastName;
        }

        // Обновляем телефон если он изменился
        if (profile.phone && profile.phone !== user.phone) {
            updates.phone = profile.phone;
        }

        if (Object.keys(updates).length > 0) {
            await user.update(updates);
            this.logger.debug(
                { userId: user.id, updates },
                'User profile updated from SSO',
            );
        }

        return user;
    }

    /**
     * Применение маппингов ролей к пользователю
     * @private
     */
    private async applyRoleMappings(
        userId: number,
        externalRoles: string[],
        roleMappings: RoleMappingModel[],
        tenantId: number,
    ): Promise<void> {
        if (externalRoles.length === 0 || roleMappings.length === 0) {
            return;
        }

        try {
            // Находим соответствующие маппинги для внешних ролей
            const applicableMappings = roleMappings.filter(
                (mapping) =>
                    mapping.isActive &&
                    externalRoles.includes(mapping.externalRoleName),
            );

            if (applicableMappings.length === 0) {
                this.logger.debug(
                    { userId, externalRoles },
                    'No applicable role mappings found',
                );
                return;
            }

            // Сортируем по приоритету (меньше = выше приоритет)
            applicableMappings.sort(
                (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
            );

            // Получаем текущие роли пользователя
            const userRolesResponse = await this.roleService.getUserRoles(
                userId,
                tenantId,
            );
            const userRoleIds = userRolesResponse.roles.map((r) => r.roleId);

            // Применяем маппинги (можно применить несколько ролей)
            for (const mapping of applicableMappings) {
                try {
                    // Проверяем, не назначена ли уже эта роль
                    if (!userRoleIds.includes(mapping.internalRoleId)) {
                        await this.roleService.assignRoleToUser(
                            {
                                userId,
                                roleId: mapping.internalRoleId,
                                tenantId,
                            },
                            tenantId,
                            userRolesResponse.roles.map((r) => r.roleName),
                        );

                        this.logger.info(
                            {
                                userId,
                                externalRole: mapping.externalRoleName,
                                internalRoleId: mapping.internalRoleId,
                            },
                            'Role applied via SSO mapping',
                        );
                    }
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);

                    this.logger.warn(
                        {
                            error: errorMessage,
                            userId,
                            mappingId: mapping.id,
                        },
                        'Failed to apply role mapping',
                    );
                    // Продолжаем применять другие маппинги
                }
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    userId,
                    externalRoles,
                },
                'Failed to apply role mappings',
            );

            throw error;
        }
    }
}

