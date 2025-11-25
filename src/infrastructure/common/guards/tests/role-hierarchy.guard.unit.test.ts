import type { IDecodedAccessToken } from '@app/domain/jwt';
import type { RoleModel } from '@app/domain/models';
import { getRoleLevel } from '@app/infrastructure/controllers/role/role-constants';
import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RoleHierarchyGuard } from '../role-hierarchy.guard';

interface TestRequest {
    user?: IDecodedAccessToken;
    method: string;
    url: string;
}

const createMockUserWithRoles = (
    userId: number,
    roles: string[],
    tenantId?: number,
): IDecodedAccessToken => ({
    id: userId,
    tenantId,
    roles: roles.map((role) => {
        const roleLevel = getRoleLevel(role);
        return {
            role,
            level: roleLevel,
            hasPermission: jest.fn(),
        } as unknown as RoleModel;
    }),
});

describe('RoleHierarchyGuard (unit)', () => {
    let guard: RoleHierarchyGuard;
    let mockReflector: jest.Mocked<Reflector>;
    let mockContext: jest.Mocked<ExecutionContext>;
    let mockRequest: TestRequest;

    beforeEach(() => {
        mockReflector = {
            getAllAndOverride: jest.fn(),
        } as unknown as jest.Mocked<Reflector>;

        mockRequest = {
            method: 'GET',
            url: '/test-endpoint',
        };

        mockContext = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue(mockRequest),
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as unknown as jest.Mocked<ExecutionContext>;

        guard = new RoleHierarchyGuard(mockReflector);
    });

    describe('Публичные endpoints (без @RequiredLevel)', () => {
        it('должен разрешить доступ если уровень не требуется', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(null);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('должен разрешить доступ если уровень undefined', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(undefined);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });
    });

    describe('Пользователь не авторизован', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(60); // TENANT_ADMIN level
        });

        it('должен вернуть 403 если пользователь не найден в request', async () => {
            mockRequest.user = undefined;

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'Пользователь не авторизован',
            );
        });
    });

    describe('Пользователь без ролей', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(60);
        });

        it('должен вернуть 403 если у пользователя нет ролей', async () => {
            mockRequest.user = {
                id: 1,
                roles: [],
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'У вас недостаточно прав доступа',
            );
        });

        it('должен вернуть 403 если roles undefined', async () => {
            mockRequest.user = {
                id: 1,
                roles: undefined as unknown as RoleModel[],
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('Недостаточный уровень роли', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(60); // Требуется TENANT_ADMIN
        });

        it('должен вернуть 403 если уровень роли пользователя < требуемого', async () => {
            mockRequest.user = createMockUserWithRoles(1, ['MANAGER']); // level 50

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'Требуется уровень роли 60 или выше',
            );
        });

        it('должен вернуть 403 если роль пользователя имеет уровень 0 (не найдена)', async () => {
            mockRequest.user = createMockUserWithRoles(1, ['UNKNOWN_ROLE']); // level 0

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('Успешная авторизация', () => {
        it('должен разрешить доступ если уровень роли >= требуемого', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(60); // Требуется TENANT_ADMIN
            mockRequest.user = createMockUserWithRoles(1, ['TENANT_ADMIN']); // level 60

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('должен разрешить доступ если уровень роли > требуемого', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(50); // Требуется MANAGER
            mockRequest.user = createMockUserWithRoles(1, ['TENANT_ADMIN']); // level 60

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('должен разрешить доступ SUPER_ADMIN к любому уровню', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(100); // Требуется SUPER_ADMIN
            mockRequest.user = createMockUserWithRoles(1, ['SUPER_ADMIN']); // level 100

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('должен разрешить доступ если первая роль имеет достаточный уровень', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(60);
            mockRequest.user = createMockUserWithRoles(1, [
                'TENANT_ADMIN', // level 60 - используется первая роль
                'MANAGER', // level 50
            ]);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });
    });

    describe('Граничные случаи', () => {
        it('должен обработать уровень 0 (минимальный)', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(0);
            mockRequest.user = createMockUserWithRoles(1, ['CUSTOMER']); // level 20

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('должен обработать уровень 100 (максимальный)', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(100);
            mockRequest.user = createMockUserWithRoles(1, ['SUPER_ADMIN']); // level 100

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('должен обработать роль без поля role', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(60);
            mockRequest.user = {
                id: 1,
                roles: [
                    {
                        role: undefined as unknown as string,
                        level: 50,
                    } as unknown as RoleModel,
                ],
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('Обработка ошибок', () => {
        it('должен обработать ошибку Reflector и вернуть 403', async () => {
            mockReflector.getAllAndOverride.mockImplementation(() => {
                throw new Error('Reflector error');
            });

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('должен обработать неизвестную ошибку', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(60);
            mockRequest.user = createMockUserWithRoles(1, ['TENANT_ADMIN']);

            // Симулируем ошибку при доступе к request
            mockContext.switchToHttp = jest.fn().mockImplementation(() => {
                throw new Error('Unknown error');
            });

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});
