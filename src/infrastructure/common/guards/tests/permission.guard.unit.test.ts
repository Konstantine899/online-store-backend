import type { IDecodedAccessToken } from '@app/domain/jwt';
import type { RoleModel } from '@app/domain/models';
import type { IRequiredPermission } from '@app/infrastructure/common/decorators/role-hierarchy.decorator';
import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../permission.guard';

interface TestRequest {
    user?: IDecodedAccessToken;
    method: string;
    url: string;
}

const createMockRole = (role: string, hasPermission: boolean): RoleModel => {
    return {
        role,
        hasPermission: jest.fn().mockReturnValue(hasPermission),
    } as unknown as RoleModel;
};

const createMockUserWithRoles = (
    userId: number,
    roles: Array<{ role: string; hasPermission: boolean }>,
): IDecodedAccessToken => ({
    id: userId,
    roles: roles.map((r) => createMockRole(r.role, r.hasPermission)),
});

describe('PermissionGuard (unit)', () => {
    let guard: PermissionGuard;
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

        guard = new PermissionGuard(mockReflector);
    });

    describe('Публичные endpoints (без @RequiresPermission)', () => {
        it('должен разрешить доступ если разрешение не требуется', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(null);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('должен разрешить доступ если разрешение undefined', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(undefined);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });
    });

    describe('Некорректное разрешение в декораторе', () => {
        it('должен вернуть 403 если resource отсутствует', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: '',
                action: 'read',
            } as IRequiredPermission);

            mockRequest.user = {
                id: 1,
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'Некорректная конфигурация разрешений',
            );
        });

        it('должен вернуть 403 если action отсутствует', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'users',
                action: '',
            } as IRequiredPermission);

            mockRequest.user = {
                id: 1,
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('Пользователь не авторизован', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'users',
                action: 'read',
            } as IRequiredPermission);
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
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'users',
                action: 'read',
            } as IRequiredPermission);
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

    describe('Отсутствие требуемого разрешения', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'users',
                action: 'manage',
            } as IRequiredPermission);
        });

        it('должен вернуть 403 если ни одна роль не имеет разрешения', async () => {
            mockRequest.user = createMockUserWithRoles(1, [
                { role: 'USER', hasPermission: false },
                { role: 'CUSTOMER', hasPermission: false },
            ]);

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                "У вас нет разрешения на выполнение действия 'manage' над ресурсом 'users'",
            );
        });

        it('должен вернуть 403 если роль не имеет метода hasPermission', async () => {
            mockRequest.user = {
                id: 1,
                roles: [
                    {
                        role: 'USER',
                    } as unknown as RoleModel,
                ],
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('должен вернуть 403 если роль null', async () => {
            mockRequest.user = {
                id: 1,
                roles: [null as unknown as RoleModel],
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('Успешная проверка разрешений', () => {
        it('должен разрешить доступ если одна из ролей имеет разрешение', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'users',
                action: 'read',
            } as IRequiredPermission);

            mockRequest.user = createMockUserWithRoles(1, [
                { role: 'USER', hasPermission: false },
                { role: 'ADMIN', hasPermission: true }, // Эта роль имеет разрешение
            ]);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            const roles = mockRequest.user?.roles;
            expect(roles).toBeDefined();
            if (roles) {
                expect(roles[1]?.hasPermission).toHaveBeenCalledWith(
                    'users',
                    'read',
                );
            }
        });

        it('должен разрешить доступ если первая роль имеет разрешение', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'products',
                action: 'create',
            } as IRequiredPermission);

            mockRequest.user = createMockUserWithRoles(1, [
                { role: 'MANAGER', hasPermission: true },
                { role: 'USER', hasPermission: false },
            ]);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            const roles = mockRequest.user?.roles;
            expect(roles).toBeDefined();
            if (roles) {
                expect(roles[0]?.hasPermission).toHaveBeenCalledWith(
                    'products',
                    'create',
                );
            }
        });

        it('должен проверить все роли до нахождения разрешения', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'orders',
                action: 'delete',
            } as IRequiredPermission);

            mockRequest.user = createMockUserWithRoles(1, [
                { role: 'USER', hasPermission: false },
                { role: 'CUSTOMER', hasPermission: false },
                { role: 'ADMIN', hasPermission: true }, // Третья роль имеет разрешение
            ]);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            // Проверяем, что все роли были проверены
            const roles = mockRequest.user?.roles;
            expect(roles).toBeDefined();
            if (roles) {
                expect(roles[0]?.hasPermission).toHaveBeenCalledWith(
                    'orders',
                    'delete',
                );
                expect(roles[1]?.hasPermission).toHaveBeenCalledWith(
                    'orders',
                    'delete',
                );
                expect(roles[2]?.hasPermission).toHaveBeenCalledWith(
                    'orders',
                    'delete',
                );
            }
        });
    });

    describe('Разные ресурсы и действия', () => {
        it('должен проверить разрешение для ресурса users и действия manage', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'users',
                action: 'manage',
            } as IRequiredPermission);

            mockRequest.user = createMockUserWithRoles(1, [
                { role: 'ADMIN', hasPermission: true },
            ]);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            const roles = mockRequest.user?.roles;
            expect(roles).toBeDefined();
            if (roles) {
                expect(roles[0]?.hasPermission).toHaveBeenCalledWith(
                    'users',
                    'manage',
                );
            }
        });

        it('должен проверить разрешение для ресурса products и действия read', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'products',
                action: 'read',
            } as IRequiredPermission);

            mockRequest.user = createMockUserWithRoles(1, [
                { role: 'CUSTOMER', hasPermission: true },
            ]);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            const roles = mockRequest.user?.roles;
            expect(roles).toBeDefined();
            if (roles) {
                expect(roles[0]?.hasPermission).toHaveBeenCalledWith(
                    'products',
                    'read',
                );
            }
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

        it('должен обработать ошибку при проверке разрешений', async () => {
            mockReflector.getAllAndOverride.mockReturnValue({
                resource: 'users',
                action: 'read',
            } as IRequiredPermission);

            const roleWithError = {
                role: 'ADMIN',
                hasPermission: jest.fn().mockImplementation(() => {
                    throw new Error('Permission check error');
                }),
            } as unknown as RoleModel;

            mockRequest.user = {
                id: 1,
                roles: [roleWithError],
            };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});
