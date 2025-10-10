import { UserModel } from '@app/domain/models';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import {
    RefreshTokenRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginHistoryService } from '@app/infrastructure/services/login-history/login-history.service';
import { RoleService } from '@app/infrastructure/services/role/role.service';
import { UserService } from '@app/infrastructure/services/user/user.service';

describe('UserService - Flags and Preferences', () => {
    let service: UserService;
    let userRepository: jest.Mocked<UserRepository>;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        isActive: true,
        isNewsletterSubscribed: false,
        isMarketingConsent: false,
        isCookieConsent: false,
        isVipCustomer: false,
        isBetaTester: false,
        preferredLanguage: 'ru',
        timezone: 'Europe/Moscow',
        themePreference: 'light',
        defaultLanguage: 'ru',
    } as UserModel;

    beforeEach(async () => {
        const mockUserRepository = {
            updateFlags: jest.fn(),
            updatePreferences: jest.fn(),
            findUserByPkId: jest.fn(),
            findUser: jest.fn(), // Added
            updatePhone: jest.fn(),
            createUser: jest.fn(),
            findUserByEmail: jest.fn(),
            updateUser: jest.fn(),
            removeUser: jest.fn(),
            getListUsers: jest.fn(),
            addRole: jest.fn(),
            removeRole: jest.fn(),
            updateUserConsents: jest.fn(),
            bulkUpdateConsents: jest.fn(),
            getConsentStats: jest.fn(),
            getUserStats: jest.fn(),
        };

        const mockRoleService = {
            findRoleByRole: jest.fn(),
        };

        const mockLoginHistoryService = {
            logLogin: jest.fn(),
            logFailedLogin: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: mockUserRepository,
                },
                {
                    provide: RoleService,
                    useValue: mockRoleService,
                },
                {
                    provide: 'UserModelRepository',
                    useValue: {},
                },
                {
                    provide: LoginHistoryService,
                    useValue: mockLoginHistoryService,
                },
                {
                    provide: RefreshTokenRepository,
                    useValue: {
                        removeListRefreshTokens: jest.fn().mockResolvedValue(0),
                        createRefreshToken: jest.fn(),
                        findRefreshTokenById: jest.fn(),
                        findListRefreshTokens: jest.fn(),
                        removeRefreshToken: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get(UserRepository);
    });

    describe('updateFlags', () => {
        it('должен успешно обновить флаги пользователя', async () => {
            const flagsDto: UpdateUserFlagsDto = {
                isActive: false,
                isNewsletterSubscribed: true,
                isMarketingConsent: true,
                isCookieConsent: true,
                isVipCustomer: true,
                isBetaTester: true,
            };

            const updatedUser = { ...mockUser, ...flagsDto };
            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updateFlags.mockResolvedValue(
                updatedUser as UserModel,
            );

            const result = await service.updateFlags(1, flagsDto);

            expect(userRepository.updateFlags).toHaveBeenCalledWith(
                1,
                flagsDto,
            );
            expect(result).toEqual(updatedUser);
        });

        it('должен обновить только переданные флаги', async () => {
            const flagsDto: UpdateUserFlagsDto = {
                isActive: false,
            };

            const updatedUser = { ...mockUser, isActive: false };
            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updateFlags.mockResolvedValue(
                updatedUser as UserModel,
            );

            const result = await service.updateFlags(1, flagsDto);

            expect(userRepository.updateFlags).toHaveBeenCalledWith(
                1,
                flagsDto,
            );
            expect(result.isActive).toBe(false);
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            const flagsDto: UpdateUserFlagsDto = {
                isActive: false,
            };

            userRepository.findUser.mockRejectedValue(
                new NotFoundException({
                    status: 404,
                    message: 'Пользователь не найден в БД',
                }),
            );

            await expect(service.updateFlags(999, flagsDto)).rejects.toThrow(
                new NotFoundException({
                    status: 404,
                    message: 'Пользователь не найден в БД',
                }),
            );
        });

        it('должен обработать пустой объект флагов', async () => {
            const flagsDto: UpdateUserFlagsDto = {};

            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updateFlags.mockResolvedValue(mockUser as UserModel);

            const result = await service.updateFlags(1, flagsDto);

            expect(userRepository.updateFlags).toHaveBeenCalledWith(
                1,
                flagsDto,
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('updatePreferences', () => {
        it('должен успешно обновить предпочтения пользователя', async () => {
            const preferencesDto: UpdateUserPreferencesDto = {
                themePreference: 'dark',
                defaultLanguage: 'en',
            };

            const updatedUser = { ...mockUser, ...preferencesDto };
            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updatePreferences.mockResolvedValue(
                updatedUser as UserModel,
            );

            const result = await service.updatePreferences(1, preferencesDto);

            expect(userRepository.updatePreferences).toHaveBeenCalledWith(
                1,
                preferencesDto,
            );
            expect(result).toEqual(updatedUser);
        });

        it('должен обновить только переданные предпочтения', async () => {
            const preferencesDto: UpdateUserPreferencesDto = {
                themePreference: 'dark',
            };

            const updatedUser = { ...mockUser, themePreference: 'dark' };
            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updatePreferences.mockResolvedValue(
                updatedUser as UserModel,
            );

            const result = await service.updatePreferences(1, preferencesDto);

            expect(userRepository.updatePreferences).toHaveBeenCalledWith(
                1,
                preferencesDto,
            );
            expect(result.themePreference).toBe('dark');
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            const preferencesDto: UpdateUserPreferencesDto = {
                themePreference: 'dark',
            };

            userRepository.findUser.mockRejectedValue(
                new NotFoundException({
                    status: 404,
                    message: 'Пользователь не найден в БД',
                }),
            );

            await expect(
                service.updatePreferences(999, preferencesDto),
            ).rejects.toThrow(
                new NotFoundException({
                    status: 404,
                    message: 'Пользователь не найден в БД',
                }),
            );
        });

        it('должен обработать пустой объект предпочтений', async () => {
            const preferencesDto: UpdateUserPreferencesDto = {};

            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updatePreferences.mockResolvedValue(
                mockUser as UserModel,
            );

            const result = await service.updatePreferences(1, preferencesDto);

            expect(userRepository.updatePreferences).toHaveBeenCalledWith(
                1,
                preferencesDto,
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('getUserStats', () => {
        it('должен вернуть статистику пользователей', async () => {
            const mockStats = {
                totalUsers: 100,
                activeUsers: 80,
                blockedUsers: 5,
                vipUsers: 10,
                newsletterSubscribers: 60,
                premiumUsers: 15,
                employees: 3,
                affiliates: 2,
                wholesaleUsers: 8,
                highValueUsers: 12,
            };

            userRepository.getUserStats.mockResolvedValue(mockStats);

            const result = await service.getUserStats();

            expect(userRepository.getUserStats).toHaveBeenCalled();
            expect(result).toEqual(mockStats);
        });

        it('должен вернуть статистику с нулевыми значениями', async () => {
            const mockStats = {
                totalUsers: 0,
                activeUsers: 0,
                blockedUsers: 0,
                vipUsers: 0,
                newsletterSubscribers: 0,
                premiumUsers: 0,
                employees: 0,
                affiliates: 0,
                wholesaleUsers: 0,
                highValueUsers: 0,
            };

            userRepository.getUserStats.mockResolvedValue(mockStats);

            const result = await service.getUserStats();

            expect(result).toEqual(mockStats);
        });
    });

    describe('Error handling', () => {
        it('должен обработать ошибку репозитория при обновлении флагов', async () => {
            const flagsDto: UpdateUserFlagsDto = {
                isActive: false,
            };

            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updateFlags.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.updateFlags(1, flagsDto)).rejects.toThrow(
                'Database error',
            );
        });

        it('должен обработать ошибку репозитория при обновлении предпочтений', async () => {
            const preferencesDto: UpdateUserPreferencesDto = {
                themePreference: 'dark',
            };

            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updatePreferences.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(
                service.updatePreferences(1, preferencesDto),
            ).rejects.toThrow('Database error');
        });

        it('должен обработать ошибку репозитория при получении статистики', async () => {
            userRepository.getUserStats.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.getUserStats()).rejects.toThrow(
                'Database error',
            );
        });
    });

    describe('Data validation edge cases', () => {
        it('должен обработать все возможные флаги', async () => {
            const allFlagsDto: UpdateUserFlagsDto = {
                isActive: true,
                isNewsletterSubscribed: true,
                isMarketingConsent: true,
                isCookieConsent: true,
                isProfileCompleted: true,
                isVipCustomer: true,
                isBetaTester: true,
                isBlocked: false,
                isVerified: true,
                isPremium: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                isTermsAccepted: true,
                isPrivacyAccepted: true,
                isAgeVerified: true,
                isTwoFactorEnabled: false,
            };

            const updatedUser = { ...mockUser, ...allFlagsDto };
            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updateFlags.mockResolvedValue(
                updatedUser as UserModel,
            );

            const result = await service.updateFlags(1, allFlagsDto);

            expect(result).toEqual(updatedUser);
        });

        it('должен обработать все возможные предпочтения', async () => {
            const allPreferencesDto: UpdateUserPreferencesDto = {
                themePreference: 'dark',
                defaultLanguage: 'en',
                notificationPreferences: { email: true, sms: false },
                translations: { button: 'Save' },
            };

            const updatedUser = { ...mockUser, ...allPreferencesDto };
            userRepository.findUser.mockResolvedValue(mockUser); // Added
            userRepository.updatePreferences.mockResolvedValue(
                updatedUser as UserModel,
            );

            const result = await service.updatePreferences(
                1,
                allPreferencesDto,
            );

            expect(result).toEqual(updatedUser);
        });
    });
});
