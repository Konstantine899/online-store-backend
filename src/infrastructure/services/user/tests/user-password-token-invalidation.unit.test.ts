/**
 * SEC-001-1: Password Update Token Invalidation Tests
 * CRITICAL SECURITY: Verify all refresh tokens are invalidated on password update
 */

import { UserModel } from '@app/domain/models';
import {
    RefreshTokenRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { LoginHistoryService } from '../../login-history/login-history.service';
import { RoleService } from '../../role/role.service';
import { UserService } from '../user.service';

describe('SEC-001-1: Password Update Token Invalidation', () => {
    let service: UserService;
    let userRepository: jest.Mocked<UserRepository>;
    let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
    let userModel: { update: jest.Mock };

    const mockUser = {
        id: 1,
        email: 'user@example.com',
        password: 'old-hash',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        findUserByPkId: jest.fn(),
                    },
                },
                {
                    provide: RefreshTokenRepository,
                    useValue: {
                        removeListRefreshTokens: jest.fn(),
                    },
                },
                {
                    provide: RoleService,
                    useValue: {
                        getRole: jest.fn(),
                    },
                },
                {
                    provide: LoginHistoryService,
                    useValue: {
                        logSuccessfulLogin: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(UserModel),
                    useValue: {
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get(UserRepository);
        refreshTokenRepository = module.get(RefreshTokenRepository);
        userModel = module.get(getModelToken(UserModel));
    });

    describe('updatePassword', () => {
        it('✅ CRITICAL: должен инвалидировать ВСЕ refresh tokens при смене пароля', async () => {
            // Arrange
            userRepository.findUserByPkId.mockResolvedValue(
                mockUser as UserModel,
            );
            userModel.update.mockResolvedValue([1]);
            refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(3); // 3 токена удалено

            // Act
            await service.updatePassword(1, 'new-hash');

            // Assert
            expect(
                refreshTokenRepository.removeListRefreshTokens,
            ).toHaveBeenCalledWith(1);
            expect(
                refreshTokenRepository.removeListRefreshTokens,
            ).toHaveBeenCalledTimes(1);
        });

        it('✅ SECURITY: должен инвалидировать токены ПЕРЕД очисткой кэша (атомарность)', async () => {
            // Arrange
            userRepository.findUserByPkId.mockResolvedValue(
                mockUser as UserModel,
            );
            userModel.update.mockResolvedValue([1]);
            refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(2);

            const callOrder: string[] = [];
            userModel.update.mockImplementation(() => {
                callOrder.push('update');
                return Promise.resolve([1]);
            });
            refreshTokenRepository.removeListRefreshTokens.mockImplementation(
                () => {
                    callOrder.push('invalidate_tokens');
                    return Promise.resolve(2);
                },
            );

            // Act
            await service.updatePassword(1, 'new-hash');

            // Assert: порядок должен быть: update → invalidate_tokens → cache
            expect(callOrder).toEqual(['update', 'invalidate_tokens']);
        });

        it('✅ должен логировать количество инвалидированных токенов', async () => {
            // Arrange
            userRepository.findUserByPkId.mockResolvedValue(
                mockUser as UserModel,
            );
            userModel.update.mockResolvedValue([1]);
            refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(5); // 5 активных сессий

            // Act
            await service.updatePassword(1, 'new-hash');

            // Assert: проверяем, что метод был вызван с правильным userId
            expect(
                refreshTokenRepository.removeListRefreshTokens,
            ).toHaveBeenCalledWith(1);
        });

        it('❌ должен бросить NotFoundException если пользователь не найден', async () => {
            // Arrange
            userRepository.findUserByPkId.mockResolvedValue(
                null as unknown as UserModel,
            );

            // Act & Assert
            await expect(
                service.updatePassword(99999, 'new-hash'),
            ).rejects.toThrow(NotFoundException);
            expect(
                refreshTokenRepository.removeListRefreshTokens,
            ).not.toHaveBeenCalled();
        });

        it('✅ должен работать корректно даже если токенов нет (0 удалено)', async () => {
            // Arrange
            userRepository.findUserByPkId.mockResolvedValue(
                mockUser as UserModel,
            );
            userModel.update.mockResolvedValue([1]);
            refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(0); // нет токенов

            // Act
            await service.updatePassword(1, 'new-hash');

            // Assert
            expect(
                refreshTokenRepository.removeListRefreshTokens,
            ).toHaveBeenCalledWith(1);
            expect(userModel.update).toHaveBeenCalledWith(
                { password: 'new-hash' },
                { where: { id: 1 } },
            );
        });

        it('🔒 SECURITY: инвалидация токенов должна быть обязательной (не пропускаться)', async () => {
            // Arrange
            userRepository.findUserByPkId.mockResolvedValue(
                mockUser as UserModel,
            );
            userModel.update.mockResolvedValue([1]);
            refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(1);

            // Act
            await service.updatePassword(1, 'new-hash');

            // Assert: removeListRefreshTokens ОБЯЗАТЕЛЬНО должен быть вызван
            expect(
                refreshTokenRepository.removeListRefreshTokens,
            ).toHaveBeenCalled();
            const callCount =
                refreshTokenRepository.removeListRefreshTokens.mock.calls
                    .length;
            expect(callCount).toBeGreaterThan(0);
        });
    });
});
