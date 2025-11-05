import type { UserModel } from '@app/domain/models';
import type {
    RefreshTokenRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import type { LoginHistoryService } from '@app/infrastructure/services/login-history/login-history.service';
import type { RoleService } from '@app/infrastructure/services/role/role.service';
import { UserService } from '@app/infrastructure/services/user/user.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
    compare: jest.fn(async (a: string, b: string) => a === b),
    hash: jest.fn(async (val: string) => `hashed:${val}`),
}));

describe('UserService', () => {
    let service: UserService;
    let userRepository: jest.Mocked<UserRepository>;
    let userModelMock: typeof UserModel;

    beforeEach(() => {
        userRepository = {
            findUserByPkId: jest.fn(),
            findUserByEmail: jest.fn(),
            updatePhone: jest.fn(),
            updateUserStatus: jest.fn(),
            findUserByIdAndTenant: jest.fn(),
            requestVerificationCode: jest.fn(),
            confirmVerificationCode: jest.fn(),
        } as unknown as jest.Mocked<UserRepository>;

        // Сброс всех моков перед каждым тестом
        jest.clearAllMocks();

        userModelMock = {} as unknown as typeof UserModel;

        // RoleService в этих тестах не используется
        const roleServiceDummy = {} as unknown as RoleService;

        const loginHistoryServiceDummy = {} as unknown as LoginHistoryService;

        const refreshTokenRepositoryDummy = {
            removeListRefreshTokens: jest.fn(),
        } as unknown as RefreshTokenRepository;

        service = new UserService(
            userRepository,
            roleServiceDummy,
            userModelMock,
            loginHistoryServiceDummy,
            refreshTokenRepositoryDummy,
        );
    });

    describe('updatePhone', () => {
        it('updates phone and returns user with id and phone', async () => {
            (userRepository.updatePhone as jest.Mock).mockResolvedValue({
                id: 10,
                phone: '+79990001122',
            });
            const result = await service.updatePhone(10, '+79990001122');
            expect(userRepository.updatePhone).toHaveBeenCalledWith(
                10,
                '+79990001122',
            );
            expect(result).toEqual({ id: 10, phone: '+79990001122' });
        });

        it('throws NotFoundException when user not updated', async () => {
            (userRepository.updatePhone as jest.Mock).mockResolvedValue(null);
            await expect(
                service.updatePhone(1, '+7999'),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('maps SequelizeValidationError to BadRequestException', async () => {
            const err = new Error('validation');
            err.name = 'SequelizeValidationError';
            (userRepository.updatePhone as jest.Mock).mockRejectedValue(err);
            await expect(service.updatePhone(1, 'bad')).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });
    });

    describe('changePassword', () => {
        it('throws NotFoundException when user not found', async () => {
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue(
                null,
            );
            await expect(
                service.changePassword(1, 'OldPass123!', 'NewPass123!'),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('throws BadRequestException when old password mismatch', async () => {
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue({
                id: 1,
                email: 'a@b.c',
            });
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue({
                id: 1,
                email: 'a@b.c',
                password: 'hashed-other',
            });
            await expect(
                service.changePassword(1, 'OldPass123!', 'NewPass123!'),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('updates password on success', async () => {
            const userWithPassword = {
                id: 1,
                email: 'a@b.c',
                password: 'OldPass123!',
                update: jest.fn(),
            };
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue({
                id: 1,
                email: 'a@b.c',
            });
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(
                userWithPassword,
            );

            await service.changePassword(1, 'OldPass123!', 'NewPass123!');
            expect(userWithPassword.update).toHaveBeenCalledWith({
                password: 'hashed:NewPass123!',
            });
        });
    });

    describe('updateUserStatus', () => {
        it('successfully updates status flags and returns updated user', async () => {
            const beforeUser = {
                id: 1,
                tenantId: 1,
                isVipCustomer: false,
                isPremium: false,
                isBetaTester: false,
            };
            const afterUser = {
                id: 1,
                tenantId: 1,
                isVipCustomer: true,
                isPremium: true,
                isBetaTester: false,
            };

            (
                userRepository.findUserByIdAndTenant as jest.Mock
            ).mockResolvedValue(beforeUser);
            (userRepository.updateUserStatus as jest.Mock).mockResolvedValue(
                afterUser,
            );

            const result = await service.updateUserStatus(
                1,
                {
                    isVipCustomer: true,
                    isPremium: true,
                },
                1,
            );

            expect(userRepository.findUserByIdAndTenant).toHaveBeenCalledWith(
                1,
                1,
            );
            expect(userRepository.updateUserStatus).toHaveBeenCalledWith(
                1,
                {
                    isVipCustomer: true,
                    isPremium: true,
                },
                1,
            );
            expect(result).toEqual(afterUser);
        });

        it('throws NotFoundException when user not found', async () => {
            (
                userRepository.findUserByIdAndTenant as jest.Mock
            ).mockResolvedValue(null);

            await expect(
                service.updateUserStatus(999, { isVipCustomer: true }, 1),
            ).rejects.toThrow(NotFoundException);
            await expect(
                service.updateUserStatus(999, { isVipCustomer: true }, 1),
            ).rejects.toThrow('не принадлежит вашему tenant');
        });

        it('throws NotFoundException when user belongs to different tenant', async () => {
            // findUserByIdAndTenant вернёт null для чужого tenant
            (
                userRepository.findUserByIdAndTenant as jest.Mock
            ).mockResolvedValue(null);

            await expect(
                service.updateUserStatus(
                    2,
                    { isVipCustomer: true },
                    1, // Админ из tenant 1 пытается изменить пользователя из tenant 2
                ),
            ).rejects.toThrow(NotFoundException);
            await expect(
                service.updateUserStatus(2, { isVipCustomer: true }, 1),
            ).rejects.toThrow('не принадлежит вашему tenant');
        });

        it('handles partial status updates correctly', async () => {
            const beforeUser = {
                id: 2,
                tenantId: 1,
                isVipCustomer: true,
                isPremium: false,
                isBetaTester: true,
            };
            const afterUser = {
                id: 2,
                tenantId: 1,
                isVipCustomer: true,
                isPremium: true,
                isBetaTester: true,
            };

            (
                userRepository.findUserByIdAndTenant as jest.Mock
            ).mockResolvedValue(beforeUser);
            (userRepository.updateUserStatus as jest.Mock).mockResolvedValue(
                afterUser,
            );

            const result = await service.updateUserStatus(
                2,
                {
                    isPremium: true,
                },
                1,
            );

            expect(result.isPremium).toBe(true);
            expect(result.isVipCustomer).toBe(true);
            expect(result.isBetaTester).toBe(true);
        });

        it('handles all status flags set to false', async () => {
            const beforeUser = {
                id: 3,
                tenantId: 1,
                isVipCustomer: true,
                isPremium: true,
                isBetaTester: true,
            };
            const afterUser = {
                id: 3,
                tenantId: 1,
                isVipCustomer: false,
                isPremium: false,
                isBetaTester: false,
            };

            (
                userRepository.findUserByIdAndTenant as jest.Mock
            ).mockResolvedValue(beforeUser);
            (userRepository.updateUserStatus as jest.Mock).mockResolvedValue(
                afterUser,
            );

            const result = await service.updateUserStatus(
                3,
                {
                    isVipCustomer: false,
                    isPremium: false,
                    isBetaTester: false,
                },
                1,
            );

            expect(result.isVipCustomer).toBe(false);
            expect(result.isPremium).toBe(false);
            expect(result.isBetaTester).toBe(false);
        });

        it('maps SequelizeValidationError to BadRequestException', async () => {
            const beforeUser = {
                id: 4,
                tenantId: 1,
                isVipCustomer: false,
                isPremium: false,
                isBetaTester: false,
            };

            (
                userRepository.findUserByIdAndTenant as jest.Mock
            ).mockResolvedValue(beforeUser);

            const err = new Error('Validation error');
            err.name = 'SequelizeValidationError';
            (userRepository.updateUserStatus as jest.Mock).mockRejectedValue(
                err,
            );

            await expect(
                service.updateUserStatus(4, { isVipCustomer: true }, 1),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('successfully updates user from same tenant', async () => {
            const beforeUser = {
                id: 5,
                tenantId: 5,
                isVipCustomer: false,
                isPremium: false,
                isBetaTester: false,
            };
            const afterUser = {
                id: 5,
                tenantId: 5,
                isVipCustomer: true,
                isPremium: false,
                isBetaTester: false,
            };

            (
                userRepository.findUserByIdAndTenant as jest.Mock
            ).mockResolvedValue(beforeUser);
            (userRepository.updateUserStatus as jest.Mock).mockResolvedValue(
                afterUser,
            );

            const result = await service.updateUserStatus(
                5,
                { isVipCustomer: true },
                5, // Тот же tenant
            );

            expect(result.tenantId).toBe(5);
            expect(result.isVipCustomer).toBe(true);
        });
    });

    describe('Verification Methods (USER-001-06)', () => {
        describe('requestVerificationCode', () => {
            it('successfully requests email verification code', async () => {
                (
                    userRepository.requestVerificationCode as jest.Mock
                ).mockResolvedValue(undefined);

                await expect(
                    service.requestVerificationCode(1, 'email', 1),
                ).resolves.toBeUndefined();

                expect(
                    userRepository.requestVerificationCode,
                ).toHaveBeenCalledWith(1, 'email', 1);
            });

            it('successfully requests phone verification code', async () => {
                (
                    userRepository.requestVerificationCode as jest.Mock
                ).mockResolvedValue(undefined);

                await expect(
                    service.requestVerificationCode(1, 'phone', 1),
                ).resolves.toBeUndefined();

                expect(
                    userRepository.requestVerificationCode,
                ).toHaveBeenCalledWith(1, 'phone', 1);
            });

            it('throws error if user not found or wrong tenant', async () => {
                const err = new NotFoundException('User not found');
                (
                    userRepository.requestVerificationCode as jest.Mock
                ).mockRejectedValue(err);

                await expect(
                    service.requestVerificationCode(999, 'email', 1),
                ).rejects.toBeInstanceOf(NotFoundException);
            });

            it('throws error if email provider fails', async () => {
                const err = new Error('Email provider failed');
                (
                    userRepository.requestVerificationCode as jest.Mock
                ).mockRejectedValue(err);

                await expect(
                    service.requestVerificationCode(1, 'email', 1),
                ).rejects.toThrow('Email provider failed');
            });

            it('throws error if sms provider fails', async () => {
                const err = new Error('SMS provider failed');
                (
                    userRepository.requestVerificationCode as jest.Mock
                ).mockRejectedValue(err);

                await expect(
                    service.requestVerificationCode(1, 'phone', 1),
                ).rejects.toThrow('SMS provider failed');
            });
        });

        describe('confirmVerificationCode', () => {
            it('successfully confirms email verification code', async () => {
                (
                    userRepository.confirmVerificationCode as jest.Mock
                ).mockResolvedValue(true);

                await expect(
                    service.confirmVerificationCode(1, 'email', 'a1b2c3', 1),
                ).resolves.toBeUndefined();

                expect(
                    userRepository.confirmVerificationCode,
                ).toHaveBeenCalledWith(1, 'email', 'a1b2c3', 1);
            });

            it('successfully confirms phone verification code', async () => {
                (
                    userRepository.confirmVerificationCode as jest.Mock
                ).mockResolvedValue(true);

                await expect(
                    service.confirmVerificationCode(1, 'phone', 'a1b2c3', 1),
                ).resolves.toBeUndefined();

                expect(
                    userRepository.confirmVerificationCode,
                ).toHaveBeenCalledWith(1, 'phone', 'a1b2c3', 1);
            });

            it('throws BadRequestException if code is invalid', async () => {
                (
                    userRepository.confirmVerificationCode as jest.Mock
                ).mockResolvedValue(false);

                await expect(
                    service.confirmVerificationCode(1, 'email', 'wrong', 1),
                ).rejects.toBeInstanceOf(BadRequestException);
            });

            it('throws BadRequestException if code is expired', async () => {
                (
                    userRepository.confirmVerificationCode as jest.Mock
                ).mockResolvedValue(false);

                await expect(
                    service.confirmVerificationCode(1, 'phone', 'expired', 1),
                ).rejects.toBeInstanceOf(BadRequestException);
            });

            it('blocks cross-tenant verification attempt', async () => {
                // User from tenant 1 trying to verify user from tenant 2
                (
                    userRepository.confirmVerificationCode as jest.Mock
                ).mockResolvedValue(false);

                await expect(
                    service.confirmVerificationCode(1, 'email', 'a1b2c3', 2),
                ).rejects.toBeInstanceOf(BadRequestException);
            });
        });
    });
});
